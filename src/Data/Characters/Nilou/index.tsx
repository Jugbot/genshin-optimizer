import { CharacterData } from 'pipeline'
import { input, tally } from "../../../Formula/index"
import { equal, greaterEq, infoMut, max, min, percent, prod, sum, unequal } from "../../../Formula/utils"
import { CharacterKey, ElementKey } from '../../../Types/consts'
import { cond, sgt, st, trans } from '../../SheetUtil'
import CharacterSheet, { charTemplates, ICharacterSheet } from '../CharacterSheet'
import { dataObjForCharacterSheet, dmgNode } from '../dataUtil'
import assets from './assets'
import data_gen_src from './data_gen.json'
import skillParam_gen from './skillParam_gen.json'

const key: CharacterKey = "Nilou"
const elementKey: ElementKey = "hydro"
const data_gen = data_gen_src as CharacterData
const [tr, trm] = trans("char", key)
const ct = charTemplates(key, data_gen.weaponTypeKey, assets)

let a = 0, s = 0, b = 0
export const datamine = {
  normal: {
    hitArr: [
      skillParam_gen.auto[a++], // 1
      skillParam_gen.auto[a++], // 2
      skillParam_gen.auto[a++], // 3
    ]
  },
  charged: {
    hit1: skillParam_gen.auto[a++],
    hit2: skillParam_gen.auto[a++],
    stamina: skillParam_gen.auto[a++][0]
  },
  plunging: {
    dmg: skillParam_gen.auto[a++],
    low: skillParam_gen.auto[a++],
    high: skillParam_gen.auto[a++],
  },
  skill: {
    skillDmg: skillParam_gen.skill[s++],
    whirl1Dmg: skillParam_gen.skill[s++],
    whirl2Dmg: skillParam_gen.skill[s++],
    moonDmg: skillParam_gen.skill[s++],
    wheelDmg: skillParam_gen.skill[s++],
    dance1Dmg: skillParam_gen.skill[s++],
    dance2Dmg: skillParam_gen.skill[s++],
    pirouetteDuration: skillParam_gen.skill[s++][0],
    lunarPrayerDuration: skillParam_gen.skill[s++][0],
    tranquilityAuraDuration: skillParam_gen.skill[s++][0],
    cd: skillParam_gen.skill[s++][0],
  },
  burst: {
    skillDmg: skillParam_gen.burst[b++],
    aeonDmg: skillParam_gen.burst[b++],
    cd: skillParam_gen.burst[b++][0],
    cost: skillParam_gen.burst[b++][0],
  },
  passive1: {
    bountyDuration: skillParam_gen.passive1[0][0],
    eleMas: skillParam_gen.passive1[1][0],
    buffDuration: skillParam_gen.passive1[2][0],
  },
  passive2: {
    dmg_: skillParam_gen.passive2[0][0],
    minHp: -skillParam_gen.passive2[1][0],
    maxDmg_: skillParam_gen.passive2[2][0],
  },
  constellation1: {
    moon_dmg_: skillParam_gen.constellation1[0],
    durationInc: skillParam_gen.constellation1[1],
  },
  constellation2: {
    hydro_enemyRes_: -skillParam_gen.constellation2[0],
    dendro_enemyRes_: -skillParam_gen.constellation2[1],
    duration: skillParam_gen.constellation2[2],
  },
  constellation4: {
    energyRegen: skillParam_gen.constellation4[0],
    burst_dmg_: skillParam_gen.constellation4[1],
    duration: skillParam_gen.constellation4[2],
  },
  constellation6: {
    critRate_: skillParam_gen.constellation6[0],
    critDmg_: skillParam_gen.constellation6[1],
    maxCritRate_: skillParam_gen.constellation6[2],
    maxCritDmg_: skillParam_gen.constellation6[3],
  }
} as const

const [condA1AfterSkillPath, condA1AfterSkill] = cond(key, "a1AfterSkill")
const [condA1AfterHitPath, condA1AfterHit] = cond(key, "a1AfterHit")
const onlyDendroHydroTeam = greaterEq(tally.dendro, 1, equal(tally.ele, 2, 1))
const isGoldenChaliceBountyActive = greaterEq(input.asc, 1, equal(onlyDendroHydroTeam, 1, equal(condA1AfterSkill, "on", 1)))
const a1AfterSkillAndHit_eleMas = equal(isGoldenChaliceBountyActive, 1, equal(condA1AfterHit, "on", datamine.passive1.eleMas))

const bountifulBloom_dmg_ = greaterEq(input.asc, 4,
  equal(isGoldenChaliceBountyActive, 1,
    min(
      prod(
        percent(datamine.passive2.dmg_),
        prod(
          max(sum(input.total.hp, datamine.passive2.minHp), 0),
          1 / 1000
        )
      ),
      percent(datamine.passive2.maxDmg_)
    )
  )
)

const c1_moon_dmg_ = greaterEq(input.constellation, 1, percent(datamine.constellation1.moon_dmg_, { key: `char_${key}:c1.moon_dmg_` }))

const [condC2HydroPath, condC2Hydro] = cond(key, "c2Hydro")
const [condC2DendroPath, condC2Dendro] = cond(key, "c2Dendro")
const c2_hydro_enemyRes_ = greaterEq(input.constellation, 2,
  equal(isGoldenChaliceBountyActive, 1,
    equal(condC2Hydro, "hydro", percent(datamine.constellation2.hydro_enemyRes_))
  )
)
const c2_dendro_enemyRes_ = greaterEq(input.constellation, 2,
  equal(isGoldenChaliceBountyActive, 1,
    equal(condC2Dendro, "dendro", percent(datamine.constellation2.dendro_enemyRes_))
  )
)

const [condC4AfterPirHitPath, condC4AfterPirHit] = cond(key, "c4AfterPirHit")
const c4_burst_dmg_ = greaterEq(input.constellation, 4, equal(condC4AfterPirHit, "on", percent(datamine.constellation4.burst_dmg_)))

const c6_critRate_ = greaterEq(input.constellation, 6,
  min(
    prod(
      percent(datamine.constellation6.critRate_),
      input.total.hp,
      1/1000
    ),
    percent(datamine.constellation6.maxCritRate_)
  )
)
const c6_critDMG_ = greaterEq(input.constellation, 6,
  min(
    prod(
      percent(datamine.constellation6.critDmg_),
      input.total.hp,
      1/1000
    ),
    percent(datamine.constellation6.maxCritDmg_)
  )
)

export const dmgFormulas = {
  normal: Object.fromEntries(datamine.normal.hitArr.map((arr, i) =>
    [i, dmgNode("atk", arr, "normal")])),
  charged: {
    dmg1: dmgNode("atk", datamine.charged.hit1, "charged"),
    dmg2: dmgNode("atk", datamine.charged.hit2, "charged")
  },
  plunging: Object.fromEntries(Object.entries(datamine.plunging).map(([key, value]) =>
    [key, dmgNode("atk", value, "plunging")])),
  skill: {
    skillDmg: dmgNode("hp", datamine.skill.skillDmg, "skill"),
    dance1Dmg: dmgNode("hp", datamine.skill.dance1Dmg, "skill"),
    dance2Dmg: dmgNode("hp", datamine.skill.dance2Dmg, "skill"),
    whirl1Dmg: dmgNode("hp", datamine.skill.whirl1Dmg, "skill"),
    whirl2Dmg: dmgNode("hp", datamine.skill.whirl2Dmg, "skill"),
    moonDmg: dmgNode("hp", datamine.skill.moonDmg, "skill", { premod: { skill_dmg_: c1_moon_dmg_ } }),
    wheelDmg: dmgNode("hp", datamine.skill.wheelDmg, "skill"),
  },
  burst: {
    skillDmg: dmgNode("hp", datamine.burst.skillDmg, "burst"),
    aeonDmg: dmgNode("hp", datamine.burst.aeonDmg, "burst"),
  },
  passive2: {
    bountifulBloom_dmg_
  },
  constellation6: {
    c6_critRate_,
    c6_critDMG_,
  }
}
const burstC3 = greaterEq(input.constellation, 3, 3)
const skillC5 = greaterEq(input.constellation, 5, 3)
export const data = dataObjForCharacterSheet(key, elementKey, "sumeru", data_gen, dmgFormulas, {
  bonus: {
    skill: skillC5,
    burst: burstC3,
  },
  teamBuff: {
    premod: {
      eleMas: a1AfterSkillAndHit_eleMas,
      bloom_dmg_: bountifulBloom_dmg_,
      hydro_enemyRes_: c2_hydro_enemyRes_,
      dendro_enemyRes_: c2_dendro_enemyRes_,
    }
  },
  premod: {
    burst_dmg_: c4_burst_dmg_,
    critRate_: c6_critRate_,
    critDMG_: c6_critDMG_,
  }
})

const sheet: ICharacterSheet = {
  key,
  name: tr("name"),
  rarity: data_gen.star,
  elementKey,
  weaponTypeKey: data_gen.weaponTypeKey,
  gender: "F",
  constellationName: tr("constellationName"),
  title: tr("title"),
  talent: {
      auto: ct.talentTemplate("auto", [{
        text: tr("auto.fields.normal"),
      }, {
        fields: datamine.normal.hitArr.map((_, i) => ({
          node: infoMut(dmgFormulas.normal[i], { key: `char_${key}_gen:auto.skillParams.${i}` }),
        }))
      }, {
        text: tr("auto.fields.charged"),
      }, {
        fields: [{
          node: infoMut(dmgFormulas.charged.dmg1, { key: `char_${key}_gen:auto.skillParams.3` }),
          textSuffix: "(1)"
        }, {
          node: infoMut(dmgFormulas.charged.dmg2, { key: `char_${key}_gen:auto.skillParams.3` }),
          textSuffix: "(2)"
        }, {
          text: tr("auto.skillParams.4"),
          value: datamine.charged.stamina,
        }]
      }, {
        text: tr(`auto.fields.plunging`),
      }, {
        fields: [{
          node: infoMut(dmgFormulas.plunging.dmg, { key: "sheet_gen:plunging.dmg" }),
        }, {
          node: infoMut(dmgFormulas.plunging.low, { key: "sheet_gen:plunging.low" }),
        }, {
          node: infoMut(dmgFormulas.plunging.high, { key: "sheet_gen:plunging.high" }),
        }]
      }]),

      skill: ct.talentTemplate("skill", [{
        fields: [{
          node: infoMut(dmgFormulas.skill.skillDmg, { key: `char_${key}_gen:skill.skillParams.0` }),
        }, {
          node: infoMut(dmgFormulas.skill.dance1Dmg, { key: `char_${key}:skill.dance1` }),
        }, {
          node: infoMut(dmgFormulas.skill.whirl1Dmg, { key: `char_${key}:skill.whirl1` }),
        }, {
          node: infoMut(dmgFormulas.skill.dance2Dmg, { key: `char_${key}:skill.dance2` }),
        }, {
          node: infoMut(dmgFormulas.skill.whirl2Dmg, { key: `char_${key}:skill.whirl2` }),
        }, {
          node: infoMut(dmgFormulas.skill.moonDmg, { key: `char_${key}:skill.moon` }),
        }, {
          node: infoMut(dmgFormulas.skill.wheelDmg, { key: `char_${key}:skill.wheel` }),
        }, {
          text: tr("skill.skillParams.4"),
          value: datamine.skill.pirouetteDuration,
          unit: "s"
        }, {
          text: tr("skill.skillParams.5"),
          value: datamine.skill.lunarPrayerDuration,
          unit: "s"
        }, {
          text: tr("skill.skillParams.6"),
          value: (data) => data.get(input.constellation).value >= 1
            ? `${datamine.skill.tranquilityAuraDuration}s + ${datamine.constellation1.durationInc}s = ${datamine.skill.tranquilityAuraDuration + datamine.constellation1.durationInc}`
            : datamine.skill.tranquilityAuraDuration,
          unit: "s"
        }, {
          text: sgt("cd"),
          value: datamine.skill.cd,
          unit: "s"
        }]
      }, ct.conditionalTemplate("constellation4", {
        path: condC4AfterPirHitPath,
        value: condC4AfterPirHit,
        name: trm("c4.condName"),
        states: {
          on: {
            fields: [{
              text: st("energyRegen"),
              value: datamine.constellation4.energyRegen,
            }, {
              node: c4_burst_dmg_
            }, {
              text: sgt("duration"),
              value: datamine.constellation4.duration,
              unit: "s",
            }]
          }
        }
      })]),

      burst: ct.talentTemplate("burst", [{
        fields: [{
          node: infoMut(dmgFormulas.burst.skillDmg, { key: `char_${key}_gen:burst.skillParams.0` })
        }, {
          node: infoMut(dmgFormulas.burst.aeonDmg, { key: `char_${key}_gen:burst.skillParams.1` })
        }, {
          text: sgt("cd"),
          value: datamine.burst.cd,
          unit: "s"
        }, {
          text: sgt("energyCost"),
          value: datamine.burst.cost,
        }]
      }]),

      passive1: ct.talentTemplate("passive1", [ct.fieldsTemplate("passive1", {
        teamBuff: true,
        canShow: unequal(onlyDendroHydroTeam, 1, 1),
        fields: [{
          text: trm("passive1.notDendroHydroTeam")
        }]
      }), ct.conditionalTemplate("passive1", {
        path: condA1AfterSkillPath,
        value: condA1AfterSkill,
        teamBuff: true,
        canShow: onlyDendroHydroTeam,
        name: trm("passive1.underChaliceEffect"),
        states: {
          on: {
            fields: [{
              text: trm("passive1.bountifulCores")
            }]
          }
        }
      }), ct.conditionalTemplate("passive1", {
        path: condA1AfterHitPath,
        value: condA1AfterHit,
        name: trm("passive1.condName"),
        teamBuff: true,
        canShow: isGoldenChaliceBountyActive,
        states: {
          on: {
            fields: [{
              node: a1AfterSkillAndHit_eleMas
            }, {
              text: sgt("duration"),
              value: datamine.passive1.buffDuration,
              unit: "s"
            }]
          }
        }
      }), ct.headerTemplate("passive2", {
        canShow: isGoldenChaliceBountyActive,
        teamBuff: true,
        fields: [{
          node: bountifulBloom_dmg_
        }]
      }), ct.conditionalTemplate("constellation2", {
        teamBuff: true,
        canShow: isGoldenChaliceBountyActive,
        states: {
          hydro: {
            path: condC2HydroPath,
            value: condC2Hydro,
            name: st("hitOp.hydro"),
            fields: [{
              node: c2_hydro_enemyRes_,
            }, {
              text: sgt("duration"),
              value: datamine.constellation2.duration,
              unit: "s"
            }]
          },
          dendro: {
            path: condC2DendroPath,
            value: condC2Dendro,
            name: st("hitOp.dendro"),
            fields: [{
              node: c2_dendro_enemyRes_
            }, {
              text: sgt("duration"),
              value: datamine.constellation2.duration,
              unit: "s"
            }]
          }
        }
      })]),
      passive2: ct.talentTemplate("passive2"),
      passive3: ct.talentTemplate("passive3"),
      constellation1: ct.talentTemplate("constellation1"),
      constellation2: ct.talentTemplate("constellation2"),
      constellation3: ct.talentTemplate("constellation3", [{ fields: [{ node: burstC3 }] }]),
      constellation4: ct.talentTemplate("constellation4"),
      constellation5: ct.talentTemplate("constellation5", [{ fields: [{ node: skillC5 }] }]),
      constellation6: ct.talentTemplate("constellation6", [{ fields: [{
        node: c6_critRate_
      }, {
        node: c6_critDMG_
      }]}]),
    },
};

export default new CharacterSheet(sheet, data, assets)