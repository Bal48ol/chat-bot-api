import {PROMPT_TYPE_SYSTEM} from "../../constants";
import {PromptRepository} from "../PromptRepository/PromptRepository";
import {FUNCTIONS} from "../../gptFunctions";


const system = `Представь что ты менеджер в сфере продаж услуг`

export class Seeder {
    constructor(
        private readonly promptRepository: PromptRepository
    ) {
    }
    async seed()  {
        await this.seedSystem();
        await this.seedFunctions();
    }

    private async seedSystem() {
        const savedPrompt = await this.promptRepository.getPrompt(PROMPT_TYPE_SYSTEM);
        if (!savedPrompt?.value) {
            console.log("Seed db with default system prompt")
            await this.promptRepository.setPrompt(PROMPT_TYPE_SYSTEM, system);
        }
    }

    private async seedFunctions(){
        for (let f of FUNCTIONS) {
            const prompt = await this.promptRepository.getPrompt(f.name);
            if (prompt){
                continue;
            }

            console.log(`Seed db with function ${f.name}`);
            await this.promptRepository.setPrompt(f.name, f.defaultValue);
        }
    }
}