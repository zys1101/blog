<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { login } from "../api/post";
import { setToken } from "../api/request";
import type { LoginInput, LoginResult } from "../types";

const route = useRoute();
const router = useRouter();
const form = reactive<LoginInput>({ username: "", password: "" });
const submitting = ref<boolean>(false);
const error = ref<string>("");
async function submit(): Promise<void> {
  if (submitting.value) return;
  error.value = "";
  if (!form.username.trim() || !form.password) {
    error.value = "请输入用户名和密码";
    return;
  }
  if (new TextEncoder().encode(form.password).length > 72) {
    error.value = "密码不能超过 72 字节";
    return;
  }
  submitting.value = true;
  try {
    const result: LoginResult = await login({
      username: form.username.trim(),
      password: form.password,
    });
    setToken(result.token);
    form.password = "";
    const redirect: unknown = route.query.redirect;
    // 不接受外部 URL 或未知路径，避免开放重定向。
    const destination: string =
      typeof redirect === "string" &&
      /^\/admin\/edit(?:\/[1-9]\d*)?$/.test(redirect)
        ? redirect
        : "/admin/edit";
    await router.replace(destination);
  } catch (cause: unknown) {
    error.value = cause instanceof Error ? cause.message : "登录失败";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="page-shell login-page">
    <div class="login-intro">
      <span class="eyebrow">A SPACE FOR YOUR THOUGHTS</span>
      <h1>
        欢迎回来，<br />继续写下你的思考<span class="heading-dot">.</span>
      </h1>
      <p>把实践变成经验，把经验写成文章。<br />你的下一篇记录，从这里开始。</p>
      <div class="login-decoration" aria-hidden="true">
        <span>{</span>
        <div><i></i><i></i><i></i><i></i></div>
        <span>}</span>
      </div>
      <RouterLink to="/" class="back-link">← 返回作品集</RouterLink>
    </div>
    <section class="login-card">
      <span class="login-mark" aria-hidden="true">&gt;_</span>
      <h2>管理登录</h2>
      <p class="muted">仅供站点所有者管理文章，无需注册。</p>
      <p v-if="route.query.expired" class="notice">登录已过期，请重新登录。</p>
      <form @submit.prevent="submit">
        <fieldset :disabled="submitting">
          <label for="username">用户名</label
          ><input
            id="username"
            v-model="form.username"
            name="username"
            autocomplete="username"
            maxlength="64"
            placeholder="输入管理员用户名"
            required
          /><label for="password">密码</label
          ><input
            id="password"
            v-model="form.password"
            name="password"
            type="password"
            autocomplete="current-password"
            maxlength="72"
            placeholder="输入管理员密码"
            required
          />
          <p v-if="error" class="error-message" role="alert">{{ error }}</p>
          <button type="submit" class="button primary full-width">
            {{ submitting ? "正在验证…" : "登录工作台" }}
            <span aria-hidden="true">→</span>
          </button>
        </fieldset>
      </form>
      <p class="login-hint">管理员账号由服务器环境变量配置。</p>
    </section>
  </div>
</template>
