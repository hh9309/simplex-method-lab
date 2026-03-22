import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键修改：设置为 /仓库名/
  // 注意：前后都需要有斜杠
  base: '/simplex-method-lab/',
  build: {
    outDir: 'dist',
    // 建议开启，方便在线调试，如果追求极致体积可以设为 false
    sourcemap: true, 
  },
  server: {
    // 确保本地开发时也能正常访问
    host: true,
  }
});