/*
 * Copyright (c) 2024. Haodong JU
 */

import { VTextField } from 'vuetify/components'
import IKUtils from 'innerken-js-utils'


export const formField = {
  name: '',
  key: '',
  component: VTextField,
  required: true,
  default: null,
  hint: '',
  componentProps: {
    rules: [],
    outlined: true,
    hideDetails: false,
    dense: true,
    menuProps: {
      offsetY: true
    }
  }

}
const ruleNoEmpty = (v) => {
  return v === false || v === 0 || !!v || 'CantBeEmpty'
}

/**
 * @param {name:string,key:string,component:object,required:boolean?} schema
 * @return {name:string,key:string,component:object}
 */
export function mapSchemaToField (schema) {
  const tmp = Object.assign({},
    formField,
    IKUtils.deepCopy(schema))
  if (!tmp.name) {
    tmp.name = tmp.key
  }
  tmp.componentProps = IKUtils.deepCopy(Object.assign({},
    formField.componentProps,
    tmp.componentProps,
    { placeholder: '...'}))
  tmp.required = tmp.required ?? true
  if (tmp.required) {
    tmp.componentProps.rules.push(ruleNoEmpty)
    tmp.componentProps.required = true
  }
  return tmp
}

export const noteField = {
  key: 'note',
  title: 'Note',
  default: '',
  required: false
}

export function generateSchema (schemas, title = '', subtitle = '') {
  return {
    title,
    subtitle,
    schemas
  }
}
