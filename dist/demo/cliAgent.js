import { createInterface } from "readline";
import { tools } from "../tools/agentTools.js";
/** OpenAI-compatible tool definitions (JSON Schema for parameters). */
function toOpenAITools() {
    return [
        {
            type: "function",
            function: {
                name: "check_balance",
                description: "Get all token balances for a Stellar address. Uses testnet by default; use network mainnet if the user's account is on mainnet.",
                parameters: {
                    type: "object",
                    properties: {
                        address: { type: "string", description: "Stellar public key (starts with G)" },
                        network: { type: "string", enum: ["testnet", "mainnet"], description: "Network (default testnet; use mainnet if user has mainnet account)" },
                    },
                    required: ["address"],
                },
            },
        },
        {
            type: "function",
            function: {
                name: "swap_asset",
                description: "Get quote and optionally execute token swap via SoroSwap DEX (testnet: XLM, USDC or contract IDs)",
                parameters: {
                    type: "object",
                    properties: {
                        fromAsset: { type: "string", description: "XLM, USDC, or Soroban contract ID (C...)" },
                        toAsset: { type: "string", description: "Same format as fromAsset" },
                        amount: { type: "string", description: "Amount to swap (e.g. 10 for 10 XLM)" },
                        address: { type: "string", description: "Your Stellar public key (G...)" },
                        network: { type: "string", enum: ["testnet", "mainnet"], description: "Network" },
                        privateKey: { type: "string", description: "Secret key for signing (DEMO ONLY). Omit for quote only." },
                    },
                    required: ["fromAsset", "toAsset", "amount", "address"],
                },
            },
        },
    ];
}
/** Read one line from stdin with prompt. */
function readLine(prompt) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}
/** Execute tool by name with parsed args; return string for the model. */
async function runOneTool(name, args) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3d1882c5-dc48-494c-98b8-3a0080ef9d74', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'cliAgent.ts:runOneTool', message: 'tool invoked', data: { name, argsKeys: Object.keys(args), address: args?.address, network: args?.network }, hypothesisId: 'H3', timestamp: Date.now() }) }).catch(() => { });
    // #endregion
    const tool = tools.find((t) => t.name === name);
    if (!tool)
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    try {
        const result = await tool.execute(args);
        return JSON.stringify(result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3d1882c5-dc48-494c-98b8-3a0080ef9d74', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'cliAgent.ts:runOneTool', message: 'tool error', data: { name, errMsg: message, stack: (stack || '').slice(0, 500) }, hypothesisId: 'H2', timestamp: Date.now() }) }).catch(() => { });
        // #endregion
        return JSON.stringify({ error: message });
    }
}
/**
 * Handle assistant message that may contain tool_calls: execute each, then
 * call OpenAI again with assistant message + tool results until we get a final text response.
 */
async function executeAgentTools(openai, model, messages, assistantMessage) {
    const current = [...messages, assistantMessage];
    if (!assistantMessage.tool_calls?.length) {
        return assistantMessage.content ?? "";
    }
    for (const tc of assistantMessage.tool_calls) {
        let args = {};
        try {
            args = JSON.parse(tc.function.arguments);
        }
        catch {
            args = {};
        }
        const result = await runOneTool(tc.function.name, args);
        current.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
        });
    }
    const next = await openai.chat.completions.create({
        model,
        messages: current,
        tools: toOpenAITools(),
        tool_choice: "auto",
    });
    const choice = next.choices[0];
    if (!choice?.message) {
        return "No response from model.";
    }
    const msg = choice.message;
    return executeAgentTools(openai, model, current, msg);
}
/** Register the `agent` command on the Commander program. */
export function registerAgentCommand(program) {
    program
        .command("agent")
        .description("Chat with Stellar DeFi agent (balance, swap quotes)")
        .option("--api-key <key>", "Groq API key (or set GROQ_API_KEY)")
        .action(async (options) => {
        const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error("Error: Set GROQ_API_KEY or pass --api-key <key>");
            process.exit(1);
        }
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({
            apiKey,
            baseURL: "https://api.groq.com/openai/v1",
        });
        const model = "llama-3.1-8b-instant";
        console.log("Stellar DeFi Agent. Commands: check balance, get swap quotes. Type 'exit' to quit.\n");
        const history = [];
        while (true) {
            const userMessage = await readLine("You: ");
            if (userMessage.toLowerCase() === "exit" || userMessage.toLowerCase() === "quit")
                break;
            if (!userMessage)
                continue;
            history.push({ role: "user", content: userMessage });
            try {
                const response = await openai.chat.completions.create({
                    model,
                    messages: history,
                    tools: toOpenAITools(),
                    tool_choice: "auto",
                });
                const choice = response.choices[0];
                if (!choice?.message) {
                    console.log("Agent: (no response)");
                    continue;
                }
                const assistantMessage = choice.message;
                const final = await executeAgentTools(openai, model, history, assistantMessage);
                console.log("Agent:", final);
                history.push({ role: "assistant", content: final });
            }
            catch (err) {
                console.error("Agent error:", err instanceof Error ? err.message : err);
            }
        }
    });
}
//# sourceMappingURL=cliAgent.js.map