import type { Profile, Project } from "../types";

// 以下定位、技术栈和占位项目仅作展示模板，上线求职前请替换成真实信息。
export const profile: Profile = {
  name: "你的名字",
  role: "后端开发 / 全栈探索",
  positioning: "以工程思维解决问题，用可靠的代码把想法变成产品。",
  email: "",
  github: "",
  resume: "", // 可填写外部简历链接；本骨架不提供文件上传。
};

export const projects: Project[] = [
  {
    id: "devlog",
    name: "个人博客与作品集",
    category: "FULL STACK",
    description:
      "从界面到接口，搭建属于自己的数字空间。记录技术实践，也让每一次思考有迹可循。",
    highlights: [
      "Vue 3 + TypeScript，前后端类型明确",
      "JWT 鉴权与草稿 / 发布管理",
      "安全的 Markdown 渲染与标签分页",
    ],
    tags: ["Vue 3", "NestJS", "MySQL"],
    links: {},
    visual: "browser",
    placeholder: false,
  },
  {
    id: "backend",
    name: "你的后端代表项目",
    category: "BACKEND · 待替换",
    description:
      "在这里放一个真实的后端项目。讲清业务场景、设计取舍，以及你独立解决的问题。",
    highlights: [
      "业务背景：描述真实需求与约束",
      "核心设计：解释方案选择与取舍",
      "验证结果：提供可复现的测试依据",
    ],
    tags: ["工程设计", "数据库", "项目占位"],
    links: {},
    visual: "flow",
    placeholder: true,
  },
  {
    id: "toolbox",
    name: "你的开源 / 实践作品",
    category: "SIDE PROJECT · 待替换",
    description:
      "把重复的工作交给代码。这里留给你的开源工具、课程设计，或一个认真打磨的小作品。",
    highlights: [
      "说明作品解决的具体问题",
      "标明自己负责的功能与实现",
      "补充仓库地址与本地运行步骤",
    ],
    tags: ["TypeScript", "自动化", "项目占位"],
    links: {},
    visual: "terminal",
    placeholder: true,
  },
];
