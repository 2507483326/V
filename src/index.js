
import {cloneDeep} from "lodash-es";
import { reactive, watch, computed } from 'vue'

export function useValid(clazz, isNeedTip = false, isNeedWatch = true) {
    let model = new clazz()
    let cloneModel = cloneDeep(model)
    const errors = reactive({})
    const _model = reactive({...model})
    let clean =  () => {
        for (let errorsKey in errors) {
            errors[errorsKey] = null
        }
    }

    let validate = async (model, fields) => {
        try {
            let validateModel = model == null ? _model : model
            await _validate(clazz, validateModel)
        } catch (err) {
            console.error('校验失败', err.errors)
            let isHasError = false
            let firstMessage = null
            for (let errorItem of err.errors) {
                if (fields == null || (fields != null && fields.includes(errorItem.field))) {
                    firstMessage = firstMessage == null ? errorItem.message : firstMessage
                    errors[errorItem.field] = errorItem.message
                    isHasError = true
                }
            }
            if (!isHasError) {
                return
            }
            if (isNeedTip) {
                throw new Error(firstMessage)
            } else {
                throw err
            }
        }
    }

    if (isNeedWatch) {
        watch(computed(() => cloneDeep(_model)), (newVal, oldValue) => {
            clean()
            for (let key in newVal) {
                if (newVal[key] != oldValue[key]) {
                    validate(null, key)
                    return
                }
            }
        }, {
            deep: true,
        })
    }

    return {
        model: _model,
        form: _model,
        errors,
        validate: validate,
        validateFields: async (fields) => {await validate(null, fields)},
        reset () {
            clean()
            Object.assign(_model, cloneModel)
        },
        clean
    }
}

async function _validate (clazz, model) {
    if (clazz.RULE_MAP == null) {
        return
    }
    let errors = []
    for (let key in model) {
        if (clazz.RULE_MAP[key] != null) {
            if (clazz.RULE_MAP[key].rulesFunc != null) {
                clazz.RULE_MAP[key].dynamicsRules = clazz.RULE_MAP[key].rulesFunc()
            } else {
                clazz.RULE_MAP[key].dynamicsRules = []
            }
            let isNeedNextValid = true
            for (let validateFun of [...clazz.RULE_MAP[key].rules, ...clazz.RULE_MAP[key].dynamicsRules]) {
                if (!isNeedNextValid) {
                    continue
                }
                let result = await validateFun(clazz.RULE_MAP[key].name, key, model[key], model)
                if (result != null) {
                    isNeedNextValid = false
                    errors.push({
                        field: key,
                        message: result
                    })
                }
            }
        }
    }
    if (errors.length > 0) {
        let error = new Error()
        error.errors = errors
        throw error;
    }
}


export function V () {
    let dArgs = Array.from(arguments);
    return (value, target) => {
        if (target.kind == 'field') {
            target.addInitializer(function () {
                if (dArgs.length < 0) {
                    return;
                }
                let constructor = this.__proto__.constructor
                _initConstructor(constructor, target)
                // 如果传入的第一个参数是数组，则直接放校验列表
                let ruleArg = null
                // 如果是字符串，则第一个是名称,不然就是校验数组
                if (typeof dArgs[0] == 'string') {
                    constructor.RULE_MAP[target.name].name = dArgs[0]
                    ruleArg = dArgs[1]
                } else {
                    ruleArg = dArgs[0]
                }
                if (typeof ruleArg == 'function') {
                    constructor.RULE_MAP[target.name].rulesFunc = ruleArg
                } else {
                    for (let ruleArgElement of ruleArg) {
                        _pushRule(constructor.RULE_MAP[target.name].rules, ruleArgElement)
                    }
                }
            })
        }
    }
}

export function required (tip) {
    return (name, key, value, model) => {
        if (value == null || value == '' || value.length == 0) {
            return tip ? tip : `请输入${name}`
        }
        return null
    }
}

export function min(minNum, tip) {
    return (name, key, value, model) => {
        if (value == null || value == '') {
            return null
        }
        if (typeof value == 'string') {
            if (value.length < minNum) {
                return tip ? tip : `${name}不能小于${minNum}位`
            }
        } else {
            if (value < minNum) {
                return tip ? tip : `${name}不能小于${minNum}`
            }
        }
        return null
    }
}



export function max(maxNum, tip) {
    return (name, key, value, model) => {
        if (value == null || value == '') {
            return null
        }
        if (typeof value == 'string') {
            if (value.length > maxNum) {
                return tip ? tip : `${name}不能大于${maxNum}位`
            }
        } else {
            if (value > maxNum) {
                return tip ? tip : `${name}不能大于${maxNum}`
            }
        }
        return null
    }

}


export function len(lenNum, tip) {
    return (name, key, value, model) => {
        if (value == null || value == '') {
            return null
        }
        if (value.length != lenNum) {
            return tip ? tip : `${name}的长度为${lenNum}`
        }
        return null
    }
}

export function pattern(regexp, tip) {
    return (name, key, value, model) => {
        if (value == null || value == '') {
            return null
        }
        if (!regexp.test(value)) {
            return tip ? tip : `请输入正确的${name}`
        }
        return null
    }
}

function _addDecorate (name, func) {
    V[name] = function () {
        let oldArgs = arguments
        return (value, target) => {
            if (target.kind == 'field') {
                target.addInitializer(function () {
                    let constructor = this.__proto__.constructor
                    _initConstructor(constructor, target)
                    _pushRule(constructor.RULE_MAP[target.name].rules, func(...oldArgs))
                })
            }
        }
    }
}

V.field = function (newName) {
    return (value, target) => {
        if (target.kind == 'field') {
            target.addInitializer(function () {
                let constructor = this.__proto__.constructor
                _initConstructor(constructor, target)
                constructor.RULE_MAP[target.name].name = newName
            })
        }
    }
}

V.custom = function (newFunc) {
    return (value, target) => {
        if (target.kind == 'field') {
            target.addInitializer(function () {
                let constructor = this.__proto__.constructor
                _initConstructor(constructor, target)
                _pushRule(constructor.RULE_MAP[target.name].rules, newFunc)
            })
        }
    }
}

function _initConstructor (constructor, target) {
    if (constructor.RULE_MAP == null) {
        constructor.RULE_MAP = {}
    }
    if (constructor.RULE_MAP[target.name] == null) {
        let validateObj = {
            name: null,
            rules: [],
            dynamicsRules: [],
            rulesFunc: null
        }
        constructor.RULE_MAP[target.name] = validateObj
    }
}

function _pushRule (list, item) {
    let index = list.findIndex(child => child == item)
    if (index < 0) {
        list.push(item)
    }
}

_addDecorate('required', required)
_addDecorate('min', min)
_addDecorate('max', max)
_addDecorate('len', len)
_addDecorate('pattern', pattern)


export default {
    useValid,
    V
}
