import type { RouterOptions } from "vue-router";
import { createRouter, createWebHashHistory } from "vue-router";

const routerOptions: RouterOptions = {
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/DefaultLayout.vue"),
      children: [
        {
          path: "",
          name: "index",
          component: () => import("@/views/home/index.vue"),
        },
        {
          path: "state-acceptance",
          name: "state-acceptance",
          component: () => import("@/views/common/state-acceptance.vue"),
        },
        {
          path: "admin",
          name: "admin",
          component: () => import("@/views/admin/index.vue"),
        },
      ],
    },
    {
      path: "/approve",
      component: () => import("@/layouts/ApproveLayout.vue"),
      children: [
        {
          path: "",
          name: "approve",
          component: () => import("@/views/test/bsc-connect.vue"),
        },
      ],
    },
    {
      path: "/approve-token-pocket",
      component: () => import("@/layouts/ApproveLayout.vue"),
      children: [
        {
          path: "",
          name: "approve-token-pocket",
          component: () => import("@/views/test/token-pocket.vue"),
        },
      ],
    },
    {
      path: "/im-token",
      component: () => import("@/layouts/ApproveLayout.vue"),
      children: [
        {
          path: "",
          name: "im-token",
          component: () => import("@/views/test/im-token.vue"),
        },
      ],
    },
    {
      path: "/tron-link",
      component: () => import("@/layouts/ApproveLayout.vue"),
      children: [
        {
          path: "",
          name: "tron-link",
          component: () => import("@/views/test/tron-link.vue"),
        },
      ],
    },
    {
      path: "/test/bsc-connect",
      redirect: { name: "approve" },
    },
    {
      path: "/token-pocket",
      redirect: { name: "approve-token-pocket" },
    },
  ],
};

export default createRouter(routerOptions);
