import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw, Router } from "vue-router";
import { getToken } from "../api/request";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
    meta: { title: "作品集" },
  },
  {
    path: "/blog",
    name: "blog",
    component: () => import("../views/BlogList.vue"),
    meta: { title: "技术文章" },
  },
  {
    path: "/blog/:id",
    name: "post",
    component: () => import("../views/Post.vue"),
    meta: { title: "文章详情" },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Login.vue"),
    meta: { title: "管理登录" },
  },
  {
    path: "/admin/edit/:id?",
    name: "admin",
    component: () => import("../views/AdminEdit.vue"),
    meta: { title: "文章管理", requiresAuth: true },
  },
];
const router: Router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 100, behavior: "smooth" };
    return { top: 0 };
  },
});
router.beforeEach((to) => {
  if ((to.meta.requiresAuth || to.path.startsWith("/admin/")) && !getToken()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
});
router.afterEach((to): void => {
  document.title = `${typeof to.meta.title === "string" ? to.meta.title : "页面未找到"} · DEV.LOG`;
});
export default router;
