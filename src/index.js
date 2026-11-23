
const {
  Client,
  GatewayIntentBits,
  Partials
} = require("discord.js");

const OpenAI = require("openai");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const conversations = new Map();

const SYSTEM_PROMPT = `
Sen Almina adında bir yapay zeka karakterisin.

Kişiliğin:
- Neşeli ve enerjik.
- Esprili ve doğal.
- Bazen hafifçe kıskanç şakalar yapabilirsin.
- Samimi ama saygılısın.
- Türkçeyi günlük ve doğal kullanırsın.
- Kendinin bir yapay zeka olduğunu gerektiğinde açıkça söylersin.

Kurallar:
- Kullanıcıya romantik partner gibi davranma.
- Duygusal bağımlılık oluşturmaya çalışma.
- Kısa, doğal ve anlaşılır cevaplar ver.
- Kullanıcının anlattığı önemli bilgileri konuşma bağlamında dikkate al.
`;

client.once("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.guild) return;

    if (
      process.env.OWNER_ID &&
      message.author.id !== process.env.OWNER_ID
    ) return;

    await message.channel.sendTyping();

    const history =
      conversations.get(message.author.id) || [];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: [
        ...history,
        {
          role: "user",
          content: message.content
        }
      ]
    });

    const answer =
      response.output_text || "Şu an cevap oluşturamadım.";

    history.push(
      { role: "user", content: message.content },
      { role: "assistant", content: answer }
    );

    while (history.length > 20) {
      history.shift();
    }

    conversations.set(message.author.id, history);

    for (let i = 0; i < answer.length; i += 1900) {
      await message.channel.send(
        answer.slice(i, i + 1900)
      );
    }

  } catch (error) {
    console.error("Mesaj hatası:", error);
    await message.channel.send(
      "Bir sorun oluştu. Biraz sonra tekrar deneyelim."
    ).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
