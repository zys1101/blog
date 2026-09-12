#!/usr/bin/env bash
# 在 ECS 服务器上执行,由 deploy/deploy.sh 自动调用,也可手动运行。
# 版本布局:/var/www/devlog-releases/<版本ID>/ 保存每个版本;
#           /var/www/devlog 是指向当前版本的软链接,Nginx 与 systemd 只认这个路径。
# 用法:deploy-remote.sh stage <tar包> <版本ID> | activate <版本ID> | rollback [版本ID] | releases | cleanup
set -euo pipefail

RELEASES=/var/www/devlog-releases
LINK=/var/www/devlog
DB_BACKUPS=/var/backups/devlog-db
KEEP_RELEASES=10
KEEP_DUMPS=30

log() { printf '[remote] %s\n' "$*"; }
die() { log "错误: $*"; exit 1; }

ensure_layout() {
  mkdir -p "$RELEASES" "$DB_BACKUPS"
  # 旧布局(/var/www/devlog 是真实目录)一次性迁移为 版本目录+软链接。
  if [ -d "$LINK" ] && [ ! -L "$LINK" ]; then
    local legacy="legacy-$(date +%Y%m%d-%H%M%S)"
    log "首次迁移:$LINK -> $RELEASES/$legacy,并建立软链接"
    mv "$LINK" "$RELEASES/$legacy"
    ln -sfn "$RELEASES/$legacy" "$LINK"
  fi
  [ -L "$LINK" ] || die "$LINK 既不是目录也不是软链接,请人工检查"
}

current_release() { basename "$(readlink "$LINK")"; }

wait_healthy() {
  local i
  for i in $(seq 1 20); do
    if curl -fsS -m 3 "http://127.0.0.1:3000/api/posts?page=1&pageSize=1" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

restart_and_check() {
  systemctl restart devlog
  if wait_healthy; then
    log "服务已重启且健康检查通过"
    return 0
  fi
  log "健康检查失败,最近日志:"
  journalctl -u devlog -n 20 --no-pager || true
  return 1
}

dump_db() {
  local f="$DB_BACKUPS/blog-$(date +%Y%m%d-%H%M%S).sql.gz"
  mysqldump --single-transaction blog | gzip > "$f"
  log "数据库已备份:$f ($(du -h "$f" | cut -f1))"
  ls -1t "$DB_BACKUPS"/blog-*.sql.gz 2>/dev/null | tail -n +$((KEEP_DUMPS + 1)) | xargs -r rm -f
}

cmd_stage() { # stage <tar包> <版本ID>
  local tarball="$1" id="$2" dir="$RELEASES/$2"
  [ -f "$tarball" ] || die "tar 包不存在:$tarball"
  log "解包到 $dir"
  mkdir -p "$dir"
  tar xzf "$tarball" -C "$dir"
  # .env 不在 tar 包里(含密钥),从当前版本继承(迁移前 $LINK 可能是真实目录)。
  if [ ! -f "$dir/backend/.env" ] && [ -e "$LINK" ] && [ -f "$LINK/backend/.env" ]; then
    cp -p "$LINK/backend/.env" "$dir/backend/.env"
    log "已从当前版本继承 .env"
  fi
  chmod 600 "$dir/backend/.env" 2>/dev/null || true
  log "安装后端依赖并构建"
  (cd "$dir/backend" && npm ci --no-audit --no-fund && npm run build)
  log "安装前端依赖并构建"
  (cd "$dir/frontend" && npm ci --no-audit --no-fund && npm run build)
  chown -R devlog:devlog "$dir"
  log "构建完成:$dir"
}

cmd_activate() { # activate <版本ID>
  local id="$1" dir="$RELEASES/$1" prev
  [ -d "$dir" ] || die "版本不存在:$dir"
  ensure_layout
  # 切换前确保 .env 就位:缺失则从当前版本继承,再没有就拒绝激活(避免停机)。
  if [ ! -f "$dir/backend/.env" ]; then
    [ -f "$LINK/backend/.env" ] || die "目标版本缺少 backend/.env 且当前版本没有可继承的,拒绝激活"
    cp -p "$LINK/backend/.env" "$dir/backend/.env"
    chown devlog:devlog "$dir/backend/.env"
    chmod 600 "$dir/backend/.env"
    log "已从当前版本继承 .env"
  fi
  prev="$(current_release)"
  dump_db
  log "切换 $LINK -> $dir"
  ln -sfn "$dir" "$LINK"
  if restart_and_check; then
    log "已激活 $id(上一版本:$prev)"
    cmd_cleanup
  else
    log "自动回滚到 $prev"
    ln -sfn "$RELEASES/$prev" "$LINK"
    systemctl restart devlog || true
    die "激活失败,已回滚;请查看上方日志"
  fi
}

cmd_rollback() { # rollback [版本ID] —— 缺省回上一个版本
  local target="${1:-}"
  ensure_layout
  if [ -z "$target" ]; then
    target="$(ls -1t "$RELEASES" | sed -n 2p)"
    [ -n "$target" ] || die "没有更早的版本可回滚"
    log "未指定版本,回滚到上一个:$target(当前:$(current_release))"
  fi
  [ -d "$RELEASES/$target" ] || die "版本不存在:$RELEASES/$target"
  log "切换 $LINK -> $RELEASES/$target"
  ln -sfn "$RELEASES/$target" "$LINK"
  restart_and_check && log "已回滚到 $target(当前线上即此版本)"
}

cmd_releases() {
  ensure_layout
  log "当前版本:$(current_release)"
  log "全部版本(新->旧):"
  ls -1t "$RELEASES"
}

cmd_cleanup() {
  [ -L "$LINK" ] || return 0
  local cur; cur="$(current_release)"
  ls -1t "$RELEASES" | tail -n +$((KEEP_RELEASES + 1)) | while read -r r; do
    [ "$r" = "$cur" ] && continue
    rm -rf "$RELEASES/$r"
    log "已清理旧版本:$r"
  done
}

case "${1:-}" in
  stage) shift; cmd_stage "$@" ;;
  activate) shift; cmd_activate "$@" ;;
  rollback) shift; cmd_rollback "$@" ;;
  releases) cmd_releases ;;
  cleanup) cmd_cleanup ;;
  *) echo "用法:$0 stage <tar包> <版本ID> | activate <版本ID> | rollback [版本ID] | releases | cleanup" >&2; exit 2 ;;
esac
