import { IFormulaSheet } from "../../../Types/character"
import { basicDMGFormula } from "../../../Util/FormulaUtil"
import { toTalentPercent } from "../../../Util/DataminedUtil"
import skillParam_gen_pre from './skillParam_gen.json'
const skillParam_gen = skillParam_gen_pre as any
const data = {
  normal: {
    hitArr: [
      toTalentPercent(skillParam_gen.auto[0]),
      toTalentPercent(skillParam_gen.auto[1]),
      toTalentPercent(skillParam_gen.auto[2]),//x2
      toTalentPercent(skillParam_gen.auto[4]),
      toTalentPercent(skillParam_gen.auto[5]),//x2
    ]
  },
  charged: {
    hit1: toTalentPercent(skillParam_gen.auto[7]),
    hit2: toTalentPercent(skillParam_gen.auto[8]),
    stam: skillParam_gen.auto[9][0]
  },
  plunging: {
    dmg: toTalentPercent(skillParam_gen.auto[10]),
    low: toTalentPercent(skillParam_gen.auto[11]),
    high: toTalentPercent(skillParam_gen.auto[12]),
  },
  skill: {
    hit1: toTalentPercent(skillParam_gen.skill[0]),
    hit2: toTalentPercent(skillParam_gen.skill[1]),
    dmgRed: toTalentPercent(skillParam_gen.skill[2]),
    duration: skillParam_gen.skill[3][0],
    cd: skillParam_gen.skill[4][0],
  },
  burst: {
    dmg: toTalentPercent(skillParam_gen.burst[0]),
    duration: skillParam_gen.burst[1][0],
    cd: skillParam_gen.burst[2][0],
    cost: skillParam_gen.burst[3][0],
  },
} as const

const formula: IFormulaSheet = {
  normal: Object.fromEntries(data.normal.hitArr.map((percentArr, i) =>
    [i, stats => basicDMGFormula(percentArr[stats.tlvl.auto], stats, "normal")])),
  charged: {
    hit1: stats => basicDMGFormula(data.charged.hit1[stats.tlvl.auto], stats, "charged"),
    hit2: stats => basicDMGFormula(data.charged.hit2[stats.tlvl.auto], stats, "charged"),
  },
  plunging: Object.fromEntries(Object.entries(data.plunging).map(([name, arr]) =>
    [name, stats => basicDMGFormula(arr[stats.tlvl.auto], stats, "plunging")])),
  skill: Object.fromEntries([
    ...Object.entries(data.skill).filter(([name]) => name !== "dmgRed").map(([name, arr]) =>
      [name, stats => basicDMGFormula(arr[stats.tlvl.skill], stats, "skill")]),
    ...Object.entries(data.skill).filter(([name]) => name !== "dmgRed").map(([name, arr]) =>
      [`${name}RainCutter`, stats => basicDMGFormula(1.5 * arr[stats.tlvl.skill], stats, "skill")]),
    ["dmgRed", stats => {
      const flat = data.skill.dmgRed[stats.tlvl.skill]
      return [s => (flat + Math.min(24, 0.2 * s.hydro_dmg_)), ["hydro_dmg_"]]
    }],
  ]),
  burst: {
    dmg: stats => basicDMGFormula(data.burst.dmg[stats.tlvl.burst], stats, "burst"),
  },
} as const

export default formula
export {
  data
}