import { PrismaClient, Pricing, ToolStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { toSlug } from './slug';

const prisma = new PrismaClient();

// ------------------------------------------------------------
// 分类定义
// ------------------------------------------------------------
const categories = [
  { name: 'AI 对话与助手', slug: 'chat', icon: '💬', color: '#6366f1', sortOrder: 10,
    description: '与大语言模型直接对话，回答问题、写作、编程、头脑风暴' },
  { name: 'AI 搜索与研究', slug: 'search', icon: '🔍', color: '#0ea5e9', sortOrder: 20,
    description: '基于 AI 的新一代搜索引擎与深度研究工具' },
  { name: 'AI 写作与内容', slug: 'writing', icon: '✍️', color: '#8b5cf6', sortOrder: 30,
    description: '文案、博客、营销内容、润色与改写' },
  { name: 'AI 绘画与设计', slug: 'image', icon: '🎨', color: '#ec4899', sortOrder: 40,
    description: '文生图、修图、Logo 与 UI 设计生成' },
  { name: 'AI 视频创作', slug: 'video', icon: '🎬', color: '#f59e0b', sortOrder: 50,
    description: '文生视频、数字人、字幕与剪辑' },
  { name: 'AI 音频与音乐', slug: 'audio', icon: '🎵', color: '#14b8a6', sortOrder: 60,
    description: '语音合成、配音、音乐生成与转录' },
  { name: 'AI 编程开发', slug: 'coding', icon: '💻', color: '#10b981', sortOrder: 70,
    description: '代码补全、生成、审查与自动化开发' },
  { name: 'AI 办公效率', slug: 'productivity', icon: '⚡', color: '#f97316', sortOrder: 80,
    description: 'PPT、表格、会议纪要、文档处理' },
  { name: 'AI Agent 与平台', slug: 'agent', icon: '🤖', color: '#a855f7', sortOrder: 90,
    description: 'Agent 框架、模型 API 平台与开发基础设施' },
  { name: 'AI 学习资源', slug: 'learn', icon: '📚', color: '#64748b', sortOrder: 100,
    description: '教程、课程、论文与资讯' },
];

// ------------------------------------------------------------
// 工具数据
// ------------------------------------------------------------
type ToolSeed = {
  name: string;
  url: string;
  description: string;
  category: string;
  pricing?: Pricing;
  needsVpn?: boolean;
  zhSupport?: boolean;
  featured?: boolean;
  logo?: string;
  tags: string[];
};

const tools: ToolSeed[] = [
  // ============ AI 对话与助手 ============
  { name: 'ChatGPT', url: 'https://chat.openai.com', category: 'chat', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'OpenAI 出品的对话式 AI，支持 GPT-4o 等多模态模型，可联网、读文件、画图、写代码，是使用最广泛的 AI 助手。',
    tags: ['OpenAI', 'GPT-4o', '对话', '多模态'] },
  { name: 'Claude', url: 'https://claude.ai', category: 'chat', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Anthropic 开发的 AI 助手，以长文本理解、安全性和写作质量著称，Artifacts 功能可直接生成可交互页面。',
    tags: ['Anthropic', '长文本', '写作', 'Artifacts'] },
  { name: 'Gemini', url: 'https://gemini.google.com', category: 'chat', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Google 的多模态 AI 助手，深度整合搜索、Gmail、Docs 等谷歌服务，支持百万级上下文。',
    tags: ['Google', '多模态', '搜索', 'Workspace'] },
  { name: 'Kimi 智能助手', url: 'https://kimi.moonshot.cn', category: 'chat', featured: true,
    pricing: Pricing.FREE, zhSupport: true,
    description: 'Moonshot AI 出品，主打超长上下文（最高 200 万字），擅长读长文档、网页总结与学术论文分析。',
    tags: ['国产', '长文本', '文档', '免费'] },
  { name: '通义千问', url: 'https://tongyi.aliyun.com', category: 'chat', featured: true,
    pricing: Pricing.FREE, zhSupport: true,
    description: '阿里云自主研发的大模型，中文能力强，支持文档解析、代码、图片理解，可免费使用。',
    tags: ['国产', '阿里云', '免费', '中文'] },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com', category: 'chat', featured: true,
    pricing: Pricing.FREE, zhSupport: true,
    description: '国产开源大模型，推理能力突出，DeepSeek-R1 在数学与代码任务上表现优异，网页与 App 均免费。',
    tags: ['国产', '开源', '推理', '免费'] },
  { name: '豆包', url: 'https://www.doubao.com', category: 'chat',
    pricing: Pricing.FREE, zhSupport: true,
    description: '字节跳动推出的 AI 对话助手，响应快、功能全，支持语音通话与图片生成，移动端体验好。',
    tags: ['国产', '字节跳动', '免费', '语音'] },
  { name: '文心一言', url: 'https://yiyan.baidu.com', category: 'chat',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '百度基于文心大模型的 AI 对话产品，中文知识问答与文学创作能力强，与百度搜索深度整合。',
    tags: ['国产', '百度', '搜索', '中文'] },
  { name: '智谱清言', url: 'https://chatglm.cn', category: 'chat',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '智谱 AI 基于 GLM 模型的对话产品，支持长文档、代码与数据分析，学术场景表现好。',
    tags: ['国产', 'GLM', '学术', '长文本'] },
  { name: '讯飞星火', url: 'https://xinghuo.xfyun.cn', category: 'chat',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '科大讯飞研发的认知大模型，语音交互能力强，教育与办公场景功能丰富。',
    tags: ['国产', '讯飞', '语音', '教育'] },
  { name: '腾讯元宝', url: 'https://yuanbao.tencent.com', category: 'chat',
    pricing: Pricing.FREE, zhSupport: true,
    description: '腾讯混元大模型应用，支持公众号文章检索与解析，可联网搜索，免费使用。',
    tags: ['国产', '腾讯', '混元', '搜索'] },
  { name: 'Grok', url: 'https://grok.com', category: 'chat',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'xAI 开发的 AI 助手，实时接入 X 平台数据，风格直言不讳，支持图像理解与推理。',
    tags: ['xAI', 'X平台', '实时', '推理'] },
  { name: 'Copilot (Microsoft)', url: 'https://copilot.microsoft.com', category: 'chat',
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: '微软基于 GPT 模型的 AI 助手，免费可用，深度整合 Windows 与 Office 生态。',
    tags: ['微软', '免费', 'Office', 'Windows'] },
  { name: 'Poe', url: 'https://poe.com', category: 'chat',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Quora 推出的多模型聚合平台，一个入口切换使用 GPT、Claude、Gemini 等主流模型。',
    tags: ['聚合', '多模型', 'Quora'] },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', category: 'search', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 搜索引擎，回答附带来源引用，适合快速查证事实与调研，Pro 版可选择更强模型。',
    tags: ['搜索', '引用', '调研', '多模型'] },

  // ============ AI 搜索与研究 ============
  { name: '秘塔 AI 搜索', url: 'https://metaso.cn', category: 'search', featured: true,
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '国产 AI 搜索引擎，无广告、结果结构化，支持学术文献检索与脑图生成，中文搜索体验优秀。',
    tags: ['国产', '搜索', '学术', '无广告'] },
  { name: 'Felo Search', url: 'https://felo.ai', category: 'search',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '跨语言 AI 搜索，可用中文提问获取全球网页信息，自动生成思维导图与报告。',
    tags: ['搜索', '跨语言', '思维导图'] },
  { name: ' Consensus', url: 'https://consensus.app', category: 'search',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '面向学术研究的 AI 搜索引擎，从论文中提取结论，帮助快速判断某观点是否有科学依据。',
    tags: ['学术', '论文', '搜索', '科研'] },
  { name: 'Elicit', url: 'https://elicit.com', category: 'search',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '科研文献分析助手，可批量提取论文信息、生成文献综述表格，大幅提升调研效率。',
    tags: ['科研', '文献', '综述', '论文'] },
  { name: 'SciSpace', url: 'https://scispace.com', category: 'search',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 论文阅读工具，可解释复杂公式与术语，支持与论文对话式提问。',
    tags: ['论文', '科研', '阅读', '解释'] },
  { name: '纳米 AI 搜索', url: 'https://www.n.cn', category: 'search',
    pricing: Pricing.FREE, zhSupport: true,
    description: '360 推出的多模态 AI 搜索，支持语音与拍照搜索，可生成结构化答案与视频脚本。',
    tags: ['国产', '360', '搜索', '免费'] },
  { name: 'You.com', url: 'https://you.com', category: 'search',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 搜索引擎，支持自定义模式（研究/编程/写作），可切换多家模型。',
    tags: ['搜索', '多模式', '聚合'] },

  // ============ AI 写作与内容 ============
  { name: 'Notion AI', url: 'https://www.notion.so/product/ai', category: 'writing', featured: true,
    pricing: Pricing.TRIAL, needsVpn: false,
    description: 'Notion 内置 AI，可在文档中直接续写、总结、翻译、生成表格，与知识库深度结合。',
    tags: ['Notion', '笔记', '写作', '效率'] },
  { name: 'Grammarly', url: 'https://www.grammarly.com', category: 'writing', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: '英文语法检查与润色工具，实时纠错、改写、调整语气，写英文邮件与论文必备。',
    tags: ['英文', '语法', '润色', '纠错'] },
  { name: 'QuillBot', url: 'https://quillbot.com', category: 'writing',
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: '英文改写与降重工具，提供多种改写模式、语法检查与摘要生成。',
    tags: ['改写', '降重', '英文', '摘要'] },
  { name: 'Effidit', url: 'https://effidit.qq.com', category: 'writing',
    pricing: Pricing.FREE, zhSupport: true,
    description: '腾讯 AI Lab 推出的智能写作助手，支持润色、纠错、补全与文本生成，免费使用。',
    tags: ['国产', '腾讯', '写作', '免费'] },
  { name: '秘塔写作猫', url: 'https://xiezuocat.com', category: 'writing',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '中文 AI 写作与校对工具，擅长公文、论文与新媒体内容，提供润色与格式规范检查。',
    tags: ['国产', '校对', '公文', '论文'] },
  { name: '火山写作', url: 'https://writingo.net', category: 'writing',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '字节跳动旗下英文写作助手，支持语法纠错、润色与全文改写，留学申请场景好用。',
    tags: ['国产', '字节', '英文', '润色'] },
  { name: 'Copy.ai', url: 'https://www.copy.ai', category: 'writing',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '营销文案生成平台，提供邮件、广告、社媒等模板化内容工作流。',
    tags: ['营销', '文案', '工作流', '模板'] },
  { name: 'Jasper', url: 'https://www.jasper.ai', category: 'writing',
    pricing: Pricing.PAID, needsVpn: true,
    description: '面向企业营销团队的 AI 内容平台，支持品牌语调定制与多人协作。',
    tags: ['营销', '企业', '品牌', '协作'] },
  { name: 'GitHub Copilot Workspace', url: 'https://github.com/features/copilot', category: 'coding', featured: true,
    pricing: Pricing.TRIAL, needsVpn: false,
    description: 'GitHub 出品的 AI 编程助手，在 IDE 中实时补全代码，支持对话式编程与 PR 审查。',
    tags: ['GitHub', '代码补全', 'IDE', '编程'] },

  // ============ AI 绘画与设计 ============
  { name: 'Midjourney', url: 'https://www.midjourney.com', category: 'image', featured: true,
    pricing: Pricing.PAID, needsVpn: true,
    description: '艺术质感最强的文生图工具，风格化与构图出色，通过 Discord 或网页使用。',
    tags: ['文生图', '艺术', '高质量', 'Discord'] },
  { name: 'Stable Diffusion (WebUI)', url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui', category: 'image', featured: true,
    pricing: Pricing.FREE, needsVpn: false,
    description: '开源文生图方案，可本地部署，支持 ControlNet 精准控图与 LoRA 模型扩展，生态最丰富。',
    tags: ['开源', '本地部署', 'ControlNet', 'LoRA'] },
  { name: '即梦 AI', url: 'https://jimeng.jianying.com', category: 'image', featured: true,
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '字节跳动推出的 AI 绘画与视频创作平台，中文提示词友好，每日赠送积分，智能画布功能强大。',
    tags: ['国产', '字节', '文生图', '视频'] },
  { name: '可灵 AI', url: 'https://klingai.kuaishou.com', category: 'image', featured: true,
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '快手自研的视频与图像生成大模型，文生视频效果领先，支持首尾帧控制与运镜。',
    tags: ['国产', '快手', '文生视频', '图像'] },
  { name: '通义万相', url: 'https://tongyi.aliyun.com/wanxiang', category: 'image',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '阿里云 AI 绘画与设计平台，支持文生图、相似图生成与商业设计场景模板。',
    tags: ['国产', '阿里云', '文生图', '设计'] },
  { name: 'LiblibAI', url: 'https://www.liblib.art', category: 'image',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '国内最大的 Stable Diffusion 模型社区与在线生图平台，模型与工作流资源丰富。',
    tags: ['国产', 'SD模型', '社区', '在线生图'] },
  { name: 'Recraft', url: 'https://www.recraft.ai', category: 'image',
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: '面向设计师的 AI 图像工具，可生成矢量图与图标，风格统一性强，适合品牌设计。',
    tags: ['矢量', '图标', '设计', '品牌'] },
  { name: 'Ideogram', url: 'https://ideogram.ai', category: 'image',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '文字渲染能力突出的文生图工具，生成海报与带字图片准确度高。',
    tags: ['文生图', '文字渲染', '海报'] },
  { name: 'Leonardo.Ai', url: 'https://leonardo.ai', category: 'image',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '游戏与概念设计导向的 AI 绘画平台，提供训练自有模型与实时画布功能。',
    tags: ['游戏', '概念设计', '模型训练'] },
  { name: 'Canva Magic Studio', url: 'https://www.canva.com/magic-studio', category: 'image',
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: 'Canva 内置 AI 设计套件，可一键生成海报、PPT 与社交媒体图片，模板海量。',
    tags: ['设计', '模板', '海报', 'PPT'] },
  { name: '文心一格', url: 'https://yige.baidu.com', category: 'image',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '百度 AI 艺术创作平台，中文提示词理解好，支持国风、写实等多种风格。',
    tags: ['国产', '百度', '文生图', '国风'] },
  { name: '稿定 AI', url: 'https://www.gaoding.com', category: 'image',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '电商设计与新媒体作图平台，AI 抠图、AI 商品图与模板库结合，运营场景实用。',
    tags: ['国产', '电商', '抠图', '模板'] },

  // ============ AI 视频创作 ============
  { name: 'Runway', url: 'https://runwayml.com', category: 'video', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '专业级 AI 视频创作平台，Gen 系列模型支持文生视频、视频编辑与特效，影视行业广泛使用。',
    tags: ['文生视频', '专业', '特效', '编辑'] },
  { name: 'Pika', url: 'https://pika.art', category: 'video',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 视频生成工具，Lip Sync 与特效模板丰富，适合短视频与创意内容。',
    tags: ['文生视频', '特效', '短视频'] },
  { name: 'Luma Dream Machine', url: 'https://lumalabs.ai/dream-machine', category: 'video',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Luma AI 的视频生成模型，画面自然流畅，支持图片转视频与关键帧控制。',
    tags: ['文生视频', '图生视频', '关键帧'] },
  { name: '海螺 AI', url: 'https://hailuoai.com', category: 'video',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: 'MiniMax 旗下的 AI 视频与对话创作平台，视频生成效果与运镜表现出色。',
    tags: ['国产', 'MiniMax', '文生视频'] },
  { name: 'Vidu', url: 'https://www.vidu.cn', category: 'video',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '生数科技推出的视频大模型，生成速度快，支持多主体一致性与动漫风格。',
    tags: ['国产', '文生视频', '动漫'] },
  { name: '智谱清影', url: 'https://chatglm.cn/video', category: 'video',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '智谱 AI 的视频生成工具，CogVideoX 模型开源，支持文生视频与图生视频。',
    tags: ['国产', '智谱', '开源', '文生视频'] },
  { name: 'PixVerse', url: 'https://pixverse.ai', category: 'video',
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: '爱诗科技 AI 视频平台，特效模板多、上手简单，适合社媒内容创作。',
    tags: ['国产', '模板', '特效', '短视频'] },
  { name: 'Sora', url: 'https://openai.com/sora', category: 'video',
    pricing: Pricing.PAID, needsVpn: true,
    description: 'OpenAI 的视频生成模型，物理真实感与镜头语言强，需 ChatGPT Plus 订阅。',
    tags: ['OpenAI', '文生视频', '高保真'] },
  { name: 'CapCut 剪映', url: 'https://www.capcut.cn', category: 'video',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '字节跳动视频剪辑工具，AI 字幕、图文成片、数字人与配音功能齐全，免费好用。',
    tags: ['国产', '剪辑', '字幕', '数字人'] },
  { name: 'Descript', url: 'https://www.descript.com', category: 'video',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '以文字稿驱动的音视频编辑器，删文字即删片段，适合播客与教程制作。',
    tags: ['剪辑', '播客', '转录', '文字驱动'] },

  // ============ AI 音频与音乐 ============
  { name: 'Suno', url: 'https://suno.com', category: 'audio', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 音乐生成标杆，输入歌词与风格即可生成完整歌曲，人声与编曲质量高。',
    tags: ['音乐生成', '歌曲', '人声', '编曲'] },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'audio', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '最自然的 AI 语音合成与声音克隆平台，支持 30+ 语言配音与有声书制作。',
    tags: ['TTS', '声音克隆', '配音', '多语言'] },
  { name: 'Udio', url: 'https://www.udio.com', category: 'audio',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 音乐创作工具，音质细腻，擅长人声与复杂编曲，可延长与重制曲目。',
    tags: ['音乐生成', '编曲', '人声'] },
  { name: '海绵音乐', url: 'https://www.haimian.com', category: 'audio',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '字节跳动 AI 音乐生成平台，中文歌曲生成效果好，支持风格定制与重新生成。',
    tags: ['国产', '字节', '音乐生成', '中文'] },
  { name: 'TME Studio', url: 'https://y.qq.com/tme_studio', category: 'audio',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '腾讯音乐推出的 AI 音乐创作工具，提供智能编曲、作词与分离人声伴奏。',
    tags: ['国产', '腾讯', '编曲', '人声分离'] },
  { name: '通义听悟', url: 'https://tingwu.aliyun.com', category: 'audio',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '阿里云音视频转写与摘要工具，会议记录、课程笔记自动生成，支持中英混说。',
    tags: ['国产', '阿里云', '转录', '会议'] },
  { name: 'Whisper', url: 'https://github.com/openai/whisper', category: 'audio',
    pricing: Pricing.FREE, needsVpn: false,
    description: 'OpenAI 开源语音识别模型，多语言转录准确率高，可本地部署，衍生工具众多。',
    tags: ['开源', '语音识别', '转录', '本地部署'] },
  { name: 'Adobe Podcast', url: 'https://podcast.adobe.com', category: 'audio',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Adobe 推出的播客音频增强工具，一键去除杂音、让录音达到录音室水准。',
    tags: ['音频增强', '降噪', '播客'] },
  { name: '通义星尘', url: 'https://tongyi.aliyun.com', category: 'audio',
    pricing: Pricing.FREE, zhSupport: true,
    description: '阿里云语音合成服务，提供多角色多情感音色，适合有声书与短视频配音。',
    tags: ['国产', 'TTS', '配音', '情感'] },

  // ============ AI 编程开发 ============
  { name: 'Cursor', url: 'https://cursor.com', category: 'coding', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: false,
    description: 'AI 原生代码编辑器，深度理解整个代码库，支持对话改代码、自动补全与 Agent 模式。',
    tags: ['IDE', '代码库理解', 'Agent', '编程'] },
  { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', category: 'coding', featured: true,
    pricing: Pricing.TRIAL, needsVpn: false,
    description: '最流行的 AI 编程助手，支持 VS Code 等主流 IDE，实时代码补全与对话生成。',
    tags: ['代码补全', 'VS Code', 'JetBrains', '编程'] },
  { name: 'Claude Code', url: 'https://www.anthropic.com/claude-code', category: 'coding', featured: true,
    pricing: Pricing.PAID, needsVpn: true,
    description: 'Anthropic 推出的命令行 AI 编程 Agent，可在终端中读写代码、运行命令、提交 PR。',
    tags: ['Agent', 'CLI', '终端', '编程'] },
  { name: '通义灵码', url: 'https://lingma.aliyun.com', category: 'coding',
    pricing: Pricing.FREE, zhSupport: true,
    description: '阿里云 AI 编程助手，免费使用，支持代码补全、单测生成与注释生成，兼容主流 IDE。',
    tags: ['国产', '阿里云', '免费', '代码补全'] },
  { name: '文心快码', url: 'https://comate.baidu.com', category: 'coding',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '百度 Comate 智能代码助手，支持多语言代码生成与优化，中文注释友好。',
    tags: ['国产', '百度', '代码补全', '编程'] },
  { name: 'CodeBuddy', url: 'https://copilot.tencent.com', category: 'coding',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '腾讯云 AI 代码助手，支持对话编程、单元测试生成与代码审查，免费额度充足。',
    tags: ['国产', '腾讯', '代码补全', '测试'] },
  { name: 'Windsurf', url: 'https://windsurf.com', category: 'coding',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Codeium 推出的 AI IDE，Cascade 功能可自主理解意图并连续执行多步编程任务。',
    tags: ['IDE', 'Agent', 'Cascade', '编程'] },
  { name: 'v0.dev', url: 'https://v0.dev', category: 'coding',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'Vercel 推出的 AI UI 生成工具，输入描述即可生成 React + Tailwind 界面代码。',
    tags: ['UI生成', 'React', 'Tailwind', '前端'] },
  { name: 'Bolt.new', url: 'https://bolt.new', category: 'coding',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'StackBlitz 的浏览器内 AI 全栈开发工具，一句话生成可运行部署的 Web 应用。',
    tags: ['全栈', '浏览器', '一键部署', '原型'] },
  { name: 'Trae', url: 'https://trae.ai', category: 'coding',
    pricing: Pricing.FREE, zhSupport: true,
    description: '字节跳动推出的 AI  IDE，支持 Builder 模式从需求到项目一键生成，免费使用。',
    tags: ['国产', '字节', 'IDE', '免费'] },
  { name: 'Replit', url: 'https://replit.com', category: 'coding',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '在线编程与协作平台，内置 AI Agent，可直接生成、运行和部署应用。',
    tags: ['在线IDE', '协作', '部署', 'Agent'] },
  { name: 'CodeRabbit', url: 'https://coderabbit.ai', category: 'coding',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 代码审查工具，自动为 Pull Request 提供逐行审查意见与改进建议。',
    tags: ['代码审查', 'PR', 'CI', '质量'] },

  // ============ AI 办公效率 ============
  { name: 'Gamma', url: 'https://gamma.app', category: 'productivity', featured: true,
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 生成 PPT 与网页的工具，输入主题即可产出设计精良的演示文稿，支持一键换风格。',
    tags: ['PPT', '演示', '网页', '设计'] },
  { name: 'AiPPT', url: 'https://www.aippt.cn', category: 'productivity',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '国产 AI 一键生成 PPT 工具，输入主题或导入文档即可生成可编辑演示文稿。',
    tags: ['国产', 'PPT', '文档导入', '免费额度'] },
  { name: '讯飞智文', url: 'https://zhiwen.xfyun.cn', category: 'productivity',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '科大讯飞 AI 文档创作平台，一句话生成 PPT、Word 与文档续写，职场场景实用。',
    tags: ['国产', '讯飞', 'PPT', 'Word'] },
  { name: 'WPS AI', url: 'https://ai.wps.cn', category: 'productivity',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: 'WPS 办公套件内置 AI，支持文档总结、表格公式生成与 PPT 美化，国内办公适配好。',
    tags: ['国产', 'WPS', '办公', '表格'] },
  { name: 'Otter.ai', url: 'https://otter.ai', category: 'productivity',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 会议记录工具，实时转录并生成摘要与待办事项，支持 Zoom 等会议平台。',
    tags: ['会议', '转录', '摘要', '待办'] },
  { name: 'Fireflies.ai', url: 'https://fireflies.ai', category: 'productivity',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: 'AI 会议助手，自动录制、转录、总结会议内容，并可检索历史讨论。',
    tags: ['会议', '转录', '检索', '团队'] },
  { name: 'Napkin', url: 'https://www.napkin.ai', category: 'productivity',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '把文字快速转化为图示与信息图的 AI 工具，写方案与汇报时很省时间。',
    tags: ['图示', '信息图', '汇报', '可视化'] },
  { name: 'Monica', url: 'https://monica.im', category: 'productivity',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '浏览器插件式 AI 助手，聚合多家模型，可随时划词翻译、总结与写作。',
    tags: ['国产', '浏览器插件', '聚合', '划词'] },
  { name: '沉浸式翻译', url: 'https://immersivetranslate.com', category: 'productivity',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '浏览器双语对照翻译插件，看外文网页与 PDF 神器，支持多家翻译服务。',
    tags: ['国产', '翻译', '浏览器插件', '双语'] },
  { name: 'Decktopus', url: 'https://www.decktopus.com', category: 'productivity',
    pricing: Pricing.PAID, needsVpn: true,
    description: 'AI 演示文稿生成器，自动完成内容组织与配图，适合快速提案。',
    tags: ['PPT', '提案', '演示'] },
  { name: 'Beautiful.ai', url: 'https://www.beautiful.ai', category: 'productivity',
    pricing: Pricing.PAID, needsVpn: true,
    description: '智能幻灯片设计工具，自动应用排版规则，保证演示文稿美观一致。',
    tags: ['PPT', '设计', '排版'] },

  // ============ AI Agent 与平台 ============
  { name: 'Coze (扣子)', url: 'https://www.coze.cn', category: 'agent', featured: true,
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '字节跳动零代码 AI Bot 开发平台，可搭建工作流、发布到飞书/微信等渠道。',
    tags: ['国产', '字节', '零代码', 'Bot', '工作流'] },
  { name: 'Dify', url: 'https://dify.ai', category: 'agent', featured: true,
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '开源 LLM 应用开发平台，可视化编排工作流与 RAG 知识库，支持自部署。',
    tags: ['开源', 'RAG', '工作流', '自部署'] },
  { name: 'FastGPT', url: 'https://fastgpt.in', category: 'agent',
    pricing: Pricing.FREE, zhSupport: true,
    description: '开源知识库问答系统，基于 RAG 构建，可快速搭建企业客服与文档问答应用。',
    tags: ['开源', 'RAG', '知识库', '问答'] },
  { name: 'n8n', url: 'https://n8n.io', category: 'agent',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '开源工作流自动化平台，深度集成 AI 节点，可连接 400+ 应用实现自动化。',
    tags: ['开源', '自动化', '工作流', '集成'] },
  { name: 'LangChain', url: 'https://www.langchain.com', category: 'agent',
    pricing: Pricing.FREE, needsVpn: true,
    description: '最流行的 LLM 应用开发框架，提供链、Agent、记忆与工具调用的标准抽象。',
    tags: ['框架', 'Agent', '开源', '开发'] },
  { name: 'OpenRouter', url: 'https://openrouter.ai', category: 'agent',
    pricing: Pricing.FREE, needsVpn: true,
    description: '统一的模型 API 网关，一个 Key 调用数百个模型，按量计费，方便比价与切换。',
    tags: ['API', '聚合', '网关', '多模型'] },
  { name: 'SiliconFlow (硅基流动)', url: 'https://siliconflow.cn', category: 'agent',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '国产模型 API 平台，提供 Qwen、GLM、DeepSeek 等开源模型服务，注册赠送额度。',
    tags: ['国产', 'API', '开源模型', '额度'] },
  { name: '阿里云百炼', url: 'https://bailian.console.aliyun.com', category: 'agent',
    pricing: Pricing.FREEMIUM, zhSupport: true,
    description: '阿里云一站式大模型应用开发平台，提供模型调用、知识库与应用编排能力。',
    tags: ['国产', '阿里云', '模型API', '应用编排'] },
  { name: 'Hugging Face', url: 'https://huggingface.co', category: 'agent', featured: true,
    pricing: Pricing.FREE, needsVpn: true,
    description: '全球最大的开源模型与数据集社区，提供 Spaces 在线 Demo 与推理 API。',
    tags: ['开源', '模型社区', '数据集', 'Spaces'] },
  { name: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT', category: 'agent',
    pricing: Pricing.FREE, needsVpn: true,
    description: '早期爆火的自主 Agent 实验项目，可让 GPT-4 自主拆分并执行复杂任务。',
    tags: ['开源', 'Agent', '自主任务', '实验'] },
  { name: 'Ollama', url: 'https://ollama.com', category: 'agent',
    pricing: Pricing.FREE, needsVpn: false,
    description: '本地大模型运行工具，一条命令跑起开源模型，保护隐私且免费。',
    tags: ['本地部署', '开源', '隐私', '免费'] },
  { name: 'LM Studio', url: 'https://lmstudio.ai', category: 'agent',
    pricing: Pricing.FREE, needsVpn: false,
    description: '图形化本地大模型运行与管理工具，支持 GGUF 模型与本地 API 服务。',
    tags: ['本地部署', 'GUI', 'GGUF', '免费'] },

  // ============ AI 学习资源 ============
  { name: 'Hugging Face 课程', url: 'https://huggingface.co/learn', category: 'learn',
    pricing: Pricing.FREE, needsVpn: true,
    description: 'HF 官方免费课程，涵盖 NLP、扩散模型与 Agents，理论与实践结合，质量很高。',
    tags: ['课程', '免费', 'NLP', '扩散模型'] },
  { name: 'DeepLearning.AI', url: 'https://www.deeplearning.ai', category: 'learn',
    pricing: Pricing.FREEMIUM, needsVpn: true,
    description: '吴恩达创立的 AI 教育平台，短课程覆盖 LLM、RAG 与 Agent 等最新主题。',
    tags: ['课程', '吴恩达', 'LLM', 'RAG'] },
  { name: 'Waytoagi', url: 'https://www.waytoagi.com', category: 'learn',
    pricing: Pricing.FREE, zhSupport: true,
    description: '中文 AI 知识库与社区，汇集教程、工具与飞书文档，适合系统学习 AI。',
    tags: ['国产', '社区', '知识库', '教程'] },
  { name: 'AI 工具集', url: 'https://ai-bot.cn', category: 'learn',
    pricing: Pricing.FREE, zhSupport: true,
    description: '中文 AI 工具导航与资讯站，收录工具全面，更新及时。',
    tags: ['国产', '导航', '资讯', '工具'] },
  { name: '通往 AGI 之路', url: 'https://github.com/chenshengyang/ai-courses', category: 'learn',
    pricing: Pricing.FREE, zhSupport: true,
    description: '中文 AI 学习路线与资源合集，覆盖大模型原理、应用与工程实践。',
    tags: ['国产', '开源', '学习路线', 'GitHub'] },
  { name: 'Papers with Code', url: 'https://paperswithcode.com', category: 'learn',
    pricing: Pricing.FREE, needsVpn: true,
    description: '论文与代码实现对照的学术站点，可追踪 SOTA 方法与复现代码。',
    tags: ['论文', '代码', 'SOTA', '学术'] },
];

// ------------------------------------------------------------
// 主流程
// ------------------------------------------------------------
async function main() {
  console.log('🌱 开始写入种子数据...');

  // 1. 清理旧数据（顺序注意外键）
  await prisma.clickLog.deleteMany();
  await prisma.toolTag.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSetting.deleteMany();
  console.log('  ✓ 已清理旧数据');

  // 2. 分类
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    categoryMap.set(c.slug, created.id);
  }
  console.log(`  ✓ 已创建 ${categories.length} 个分类`);

  // 3. 标签
  const tagMap = new Map<string, string>();
  const allTagNames = [...new Set(tools.flatMap((t) => t.tags))];
  for (const name of allTagNames) {
    const created = await prisma.tag.create({ data: { name } });
    tagMap.set(name, created.id);
  }
  console.log(`  ✓ 已创建 ${allTagNames.length} 个标签`);

  // 4. 工具
  let order = 100;
  for (const t of tools) {
    const categoryId = categoryMap.get(t.category);
    if (!categoryId) {
      console.warn(`  ⚠ 跳过 ${t.name}：分类 ${t.category} 不存在`);
      continue;
    }

    await prisma.tool.create({
      data: {
        name: t.name,
        slug: await uniqueSlug(t.name),
        url: t.url,
        description: t.description,
        logo: t.logo || '',
        categoryId,
        pricing: t.pricing || Pricing.FREE,
        needsVpn: t.needsVpn ?? false,
        zhSupport: t.zhSupport ?? false,
        featured: t.featured ?? false,
        sortOrder: order--,
        status: ToolStatus.PUBLISHED,
        clicks: Math.floor(Math.random() * 900) + 20,
        tags: {
          create: t.tags
            .filter((name) => tagMap.has(name))
            .map((name) => ({ tagId: tagMap.get(name)! })),
        },
      },
    });
  }
  console.log(`  ✓ 已创建 ${tools.length} 个工具`);

  // 5. 管理员账号
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  await prisma.user.create({
    data: {
      username: adminUsername,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: '超级管理员',
      role: UserRole.ADMIN,
    },
  });
  console.log(`  ✓ 管理员账号：${adminUsername} / ${adminPassword}`);

  // 6. 站点设置
  await prisma.siteSetting.create({
    data: {
      id: 'default',
      siteName: 'AI 导航',
      description: '发现最好用的 AI 工具 — 收录对话、绘画、视频、编程、办公等全品类 AI 应用',
      keywords: 'AI工具,AI导航,人工智能,ChatGPT,Midjourney,AI绘画,AI视频',
      notice: '所有工具均来自互联网收集，点击后将跳转至对应官方网站。',
    },
  });
  console.log('  ✓ 站点设置已初始化');

  console.log('✅ 种子数据写入完成');
}

async function uniqueSlug(name: string) {
  let slug = toSlug(name);
  let i = 1;
  while (await prisma.tool.findUnique({ where: { slug } })) {
    slug = `${slug}-${i++}`;
  }
  return slug;
}

main()
  .catch((e) => {
    console.error('❌ 种子数据写入失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
