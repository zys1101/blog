import type { Profile, Project } from "../types";

// 以下定位信息仅作展示模板，上线求职前请替换成真实信息。
export const profile: Profile = {
  name: "zrocks",
  role: "后端开发 / 全栈探索",
  positioning: "以工程思维解决问题，用可靠的代码把想法变成产品。",
  email: "zrocks@qq.com",
  github: "https://github.com/zys1101",
  resume: "", // 可填写外部简历链接；本骨架不提供文件上传。
};

export const projects: Project[] = [
  {
    id: "mech-crowdsourcing",
    name: "机械设计众包平台",
    category: "FULL STACK",
    description:
      "连接机械设计需求方与设计师的全栈众包平台，跑通「发布需求 → AI 报价 → 设计师报价 → 支付 → 交付验收 → 提现」完整业务闭环。微信小程序、网站与管理后台共用同一套后端与数据库。",
    highlights: [
      "NestJS + Prisma + MySQL 单一后端，小程序与网站共用 /api/mp/v1",
      "内置 AI 报价引擎：LLM 只做理解与分类，价格由确定性规则计算",
      "微信登录与支付（MOCK 模式可本地跑通），167 单测 + 45 e2e 保障交易链路",
    ],
    tags: ["NestJS", "uni-app", "Vue 3", "MySQL", "微信支付"],
    links: { source: "https://github.com/zys1101/mech-design-platform" },
    visual: "browser",
    placeholder: false,
  },
  {
    id: "quote-agent-rag",
    name: "AI 报价 Agent（RAG 引擎）",
    category: "AI · BACKEND",
    description:
      "机械设计 AI 报价系统的本地 Agent：LLM 只负责阅读需求资料与分类，价格与人工审核判定完全由确定性规则引擎计算；通过 Qdrant 向量检索脱敏历史成交案例，为报价与审核提供依据。",
    highlights: [
      "Qdrant RAG + bge-m3 向量检索脱敏真实成交案例，拼入评估提示词",
      "LLM 只输出结构化需求，完整度分数由规则确定性重算，不信任模型自报",
      "SQLite 幂等缓存与审计日志，按需触发 LLM 审核，多阶段任务并行化",
    ],
    tags: ["Python", "Qdrant", "RAG", "Ollama", "Docker"],
    links: { source: "https://github.com/zys1101/agent" },
    visual: "terminal",
    placeholder: false,
  },
  {
    id: "rm-sentry-vision",
    name: "RoboMaster 哨兵视觉",
    category: "C++ · VISION",
    description:
      "Horizon 战队 RM26 赛季全车型通用自瞄仓库，本人负责其中哨兵（sentry）分支的视觉代码开发与维护：哨兵作为全自动作战单元，其自瞄逻辑在独立分支上迭代演进。",
    highlights: [
      "C++ / CMake，OpenCV 图像处理 + OpenVINO / TensorRT 双推理框架",
      "串口 / USB2CAN 与电控通信，适配 x86 MiniPC 与 Jetson Orin Nano",
      "哨兵分支独立迭代，与其它车型分支（英雄 / 步兵等）解耦",
    ],
    tags: ["C++", "OpenCV", "TensorRT", "RoboMaster"],
    links: {
      source: "https://github.com/Horizon-Rm-Vision/Horizon_Rm_Vision_26/tree/sentry",
    },
    visual: "flow",
    placeholder: false,
  },
];
