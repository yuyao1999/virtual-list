<!-- @format -->

## Component properties

| property                | explain                               | type     | default                                     |
| ----------------------- | ------------------------------------- | -------- | ------------------------------------------- |
| page                    | page number                           | number   | 1                                           |
| size                    | pageSize                              | number   | 10                                          |
| request                 | getting data                          | Function | ()=>{}                                      |
| built-in                | Whether to use built-in list notation | boolean  | false                                       |
| container-styles-string | Container css Styles                  | string   | height:50vh;background:#f5f5f5;margin:1rem; |

## Component slots

| slot name | explain      |
| --------- | ------------ |
| loading   | data loading |
| loaded    | data loaded  |

## Component method

| name    | explain                           | type     |
| ------- | --------------------------------- | -------- |
| refresh | refresh the list keep page, size  | Function |
| reload  | refresh the list reset page, size | Function |

## Examples of Use

## vue

```
<!-- @format -->

<template>
  <div class="demo">
    <div @click="onReload">reload</div>
    <yy-virtual-list id="virtualListId" ref="yyEl" :estimatedItemSize="192" @change="virtualListChange" :request="fetchDemo" style="--containerHeight: 50vh">
      <div class="card" v-for="item in virtualList" :key="item._index" :id="item._index">
        <div class="inner">
          <div>{{ item.index }}</div>
          <div>{{ item.name }}</div>
          <div>{{ item.email }}</div>
        </div>
      </div>
    </yy-virtual-list>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import "yy-virtual-list"

const fetchDemo = async (page: number, size: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = []
      for (let i = 0; i < size; i++) {
        data.push({
          index: (page - 1) * size + i + 1,
          name: `name${page}`,
          email: `email${i}@email.com`,
        })
      }
      resolve(data)
    }, Math.random() * 1000)
  })
}

const virtualList = ref([] as any)
const virtualListChange = (val: any) => {
  virtualList.value = val.detail
}
const yyEl = ref()
const onReload = () => {
  yyEl.value?.reload()
}
</script>
<style>
:root {
  --containerHeight: 30vh;
}
.card {
  padding: 1rem;
  color: #fff;
}
.inner {
  background: #3c3c3c;
  border-radius: 20px;
  padding: 0.5rem;
}
</style>

```

### vite 去除自定义标签警告

```
 plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将所有带yy短横线的标签名都视为自定义元素
          isCustomElement: (tag) => tag.includes('yy-virtual-list'),
        },
      },
    }),
  ],
```

## html

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script type="module" src="/src/index.ts"></script>
    <style>
      .loading {
        color: red;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div onclick="reload()">reload</div>
    <yy-virtual-list
      built-in="true"
      container-styles-string="
    height:80vh;background:#f5f5f5;margin:1rem;border-radius:20px
    "
    >
      <yy-template>
        <style>
          .card{
            padding:1rem;box-size;color:#fff;
          }
          .inner{background:#3C3C3C; border-radius: 20px;padding: 0.5rem;}
        </style>
        <div class="card">
          <div class="inner">
            <strong>${this.index}</strong>
            <strong>${this.name}</strong>
            is
            <div class="te">${this.email}</div>
          </div>
        </div>
      </yy-template>
      <div slot="loading" class="loading">~loading~</div>
    </yy-virtual-list>
  </body>
  <script>
    // 模拟数据
    const fetchDemo = (page, size) => {
      if (page === 3) {
        return []
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          const data = []
          for (let i = 0; i < size; i++) {
            data.push({
              index: (page - 1) * size + i + 1,
              name: `name${page}`,
              email: `email${i}@email.com`,
            })
          }
          resolve(data)
        }, Math.random() * 1000)
      })
    }
    const el = document.getElementsByTagName("yy-virtual-list")[0]
    // 添加自定义属性 request
    el.setAttribute("request", fetchDemo)
    const reload = () => {
      console.log("reload")
      el.reload()
    }
  </script>
</html>
```
