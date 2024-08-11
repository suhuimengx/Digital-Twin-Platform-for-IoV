import { createApp } from "vue";
import App from "./App.vue";


// import "~/styles/element/index.scss";

// import ElementPlus from "element-plus";
// import all element css, uncommented next line
// import "element-plus/dist/index.css";

// or use cdn, uncomment cdn link in `index.html`

import "~/styles/index.scss";
import "uno.css";
import ECharts from 'vue-echarts'
import 'echarts'
// main.ts
import 'element-plus/theme-chalk/dark/css-vars.css'


const app = createApp(App);

app.component('v-chart',ECharts);

// 注册 ECharts 到全局属性
//app.config.globalProperties.$echarts = echarts;

// app.use(ElementPlus);
app.mount("#app");
