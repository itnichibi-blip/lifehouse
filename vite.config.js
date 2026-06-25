import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
  base: "./",
  root: './src', //開発ディレクトリ設定
  build: {
    outDir: '../dist', //出力場所の指定
    rollupOptions: { //ファイル出力設定
      output: {
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.')[1];
          //Webフォントファイルの振り分け
          if (/ttf|otf|eot|woff|woff2/i.test(extType)) {
            extType = 'fonts';
          }
          if (/png|jpe?g|svg|gif|glb|webp|mov|jp|center|com|tiff|bmp|ico|mp4/i.test(extType)) {
            extType = 'img';
          }
          // if (/pdf/i.test(extType)) {
          //   extType = 'pdf';
          // }
          //ビルド時のCSS名を明記してコントロールする
          if(extType === 'css') {
            return `assets/css/style.css`;
          }
          return `assets/${extType}/[name][extname]`;
        },
        chunkFileNames: `assets/js/[name].js`,
        entryFileNames: `assets/js/[name].js`,
      },
        input: {
          index: resolve(__dirname, './src/index.html'),

		//   複数HTMLページを出力したい時にここへ追記していく
        works: resolve(__dirname, './src/works.html'),


        },

        //  list: resolve(__dirname, './src/list.html'),

    },
  },
});
