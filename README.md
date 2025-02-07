# V
大名鼎鼎的V轻量级的表单校验工具库，支持自定义校验规则和装饰器语法，旨在简化前端表单验证逻辑。

## 特性

1. **装饰器支持**：通过装饰器定义字段校验规则，代码更简洁。
2. **动态校验规则**：支持动态生成校验规则。
3. **灵活的校验逻辑**：支持全量校验和特定字段校验。
4. **响应式支持**：基于 Vue 3 的 `reactive` 和 `watch`，自动监听表单变化并触发校验。

## 安装

```
npm install @mtdst/v
或者
yarn add @mtdst/v
```

## 使用示例

```
<script>

import { required, useValid, min, max, V, len, pattern } from '@mtdst/v'

const { model, errors, validate, validateFields, clean} = useValid(class {
  @V('用户名/手机号', [required(), min(3), max(32)])
  userName = "";

  // 动态校验
  @V('密码', () => loginWay.value == 'password' ? [required(), pattern(RegExp('^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]'))] : [])
  password = "";
  
  // 或者也可以分开写
  @V.field('校验码')
  @V.required()
  @V.len(6)
  code = "";
})

async function sendCode() {
	clean()
	await validateFields(['userName'])
	// 发送校验码逻辑
}


async function login() {
	clean()
	await validate()
	// 登录逻辑
}

</script>

<template>
	<input v-model="model.userName" />
	<span>{{errors.userName}}</span>
	<input v-model="model.password" />
	<span>{{errors.password}}</span>
	<input v-model="model.code" />
	<span>{{errors.code}}</span>
	<button @click="sendCode">发送校验码</button>
	<button @click="login">登录</button> 
</template>
```

## 如何使用

### 1. `useValid` 函数

`useValid` 是核心函数，用于初始化表单校验逻辑。

#### 参数说明

-   `clazz`：定义表单字段和校验规则的类。
-   `isNeedWatch`（可选，`boolean`）：是否需要监听表单变化并自动校验，默认为 `true`。

### 2.返回值

-   `model`：响应式的表单数据。
-   `form`：响应式的表单数据。
-   `errors`：响应式的错误信息集合。
-   `validate`：全量校验函数。
-   `validateFields`：特定字段校验函数。
-   `reset`：重置表单和错误信息。
-   `clean`：清空错误信息。

这里 `model` 和 `form` 是一个对象，只是方便不同命名习惯的人进行导入

这里有两种使用方式
```
// 第一种使用数组的方式放入导入的校验规则
@V('用户名/手机号', [required(), min(3), max(32)])
userName = "";

// 第二种分开写使用 V.xxx 的方式使用
@V.field('校验码')
@V.required()
@V.len(6)
code = "";

```

### 3.默认的校验
内置的默认的校验有

-    **必填校验**：
    
```
    @V.required('必填项提示')
```
    
-   **最小长度校验**：

```
   @V.min(3, '最小长度提示')
```
    
-   **最大长度校验**：

```
    @V.max(10, '最大长度提示')
```
    
-   **正则校验**：

```
    @V.pattern(/^[A-Za-z0-9]+$/, '正则提示')
```

后面这个提示语如果不写，则会是默认的提示信息

###  4. 自定义校验

```
@V.custom((name, key, value, model) => {
  // 自定义校验逻辑
  if (value !== 'custom') {
    return `${name} 必须是 custom`;
  }
  return null;
})

或者
@V('用户名/手机号', [(name, key, value, model) => {
  // 自定义校验逻辑
  if (value !== 'custom') {
    return `${name} 必须是 custom`;
  }
  return null;
}])

```

自定义校验 会传入 4 个参数
-   `name`：用户定义的 `field` 名称
-   `key`：表单的键名称
-   `value`：表单的键的值
-   `model`：表单实体化对象

如果需要异步校验，则将函数申明为 async 即可
