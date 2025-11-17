import { getAllAiModels } from "@/modules/ai-model/actions/seed-models.action";
import ChatbotClient from "./ChatbotClient";

// Suggestion list
const suggestions = [
    "What are the latest trends in AI?",
    "How does machine learning work?",
    "Explain quantum computing",
    "Best practices for React development",
    "Tell me about TypeScript benefits",
    "How to optimize database queries?",
    "What is the difference between SQL and NoSQL?",
    "Explain cloud computing basics",
];

// Model list interface
interface Model {
    id: string;
    name: string;
}

const ChatbotPage = async () => {
    const response = await getAllAiModels();

    const models: Model[] = (response.data ?? []).map((model) => ({
        id: `${model.provider}/${model.modelId}`,
        name: model.displayName,
    }));

    return <ChatbotClient models={models} suggestions={suggestions} />;
};

export default ChatbotPage;
