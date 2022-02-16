import type { WeaponData } from 'pipeline'
import { input } from '../../../../Formula'
import { equal, subscript, sum } from "../../../../Formula/utils"
import { allElements, WeaponKey } from '../../../../Types/consts'
import { range } from '../../../../Util/Util'
import { cond } from '../../../SheetUtil'
import { dataObjForWeaponSheet } from '../../util'
import WeaponSheet, { IWeaponSheet } from '../../WeaponSheet'
import iconAwaken from './AwakenIcon.png'
import data_gen_json from './data_gen.json'
import icon from './Icon.png'

const key: WeaponKey = "KagurasVerity"
const data_gen = data_gen_json as WeaponData
const dmg_ = [0.12, 0.15, 0.18, 0.21, 0.24]
const [condPath, condNode] = cond(key, "KaguraDance")

const skill_dmg_s = range(1, 3).map(i => equal(condNode, i.toString(), subscript(input.weapon.refineIndex, dmg_.map(d => d * i)), { key: "skill_dmg_" }))

const ele_dmg_s = Object.fromEntries(allElements.map(ele => [ele, equal(condNode, "3", subscript(input.weapon.refineIndex, dmg_))]))

export const data = dataObjForWeaponSheet(key, data_gen, {
  premod: {
    skill_dmg_: sum(...skill_dmg_s),
    ...Object.fromEntries(allElements.map(ele => [`${ele}_dmg_`, ele_dmg_s[ele]]))
  },
})
const sheet: IWeaponSheet = {
  icon,
  iconAwaken,
  document: [{
    conditional: {
      value: condNode,
      path: condPath,
      name: "KaguraDance",
      states: {
        1: {
          name: "1",
          fields: [{ node: skill_dmg_s[0] }]
        },
        2: {
          name: "2",
          fields: [{ node: skill_dmg_s[1] }]
        },
        3: {
          name: "3",
          fields: [{ node: skill_dmg_s[2], },
          ...allElements.map(ele => ({ node: ele_dmg_s[ele] }))
          ]
        }
      }
    }
  }],
}
export default new WeaponSheet(key, sheet, data_gen, data)