import { CharacterData } from 'pipeline'
import { input } from '../../../Formula'
import { constant, equal, greaterEq, infoMut, lookup, matchFull, percent, prod, subscript, sum, unequal } from "../../../Formula/utils"
import { CharacterKey, ElementKey } from '../../../Types/consts'
import { INodeFieldDisplay } from '../../../Types/IFieldDisplay_WR'
import { range } from '../../../Util/Util'
import { cond, sgt, st, trans } from '../../SheetUtil'
import CharacterSheet, { ICharacterSheet, normalSrc, talentTemplate } from '../CharacterSheet'
import { dataObjForCharacterSheet, dmgNode } from '../dataUtil'
import { banner, burst, c1, c2, c3, c4, c5, c6, card, passive1, passive2, passive3, skill, thumb, thumbSide } from './assets'
import { data as datamine } from './data'
import data_gen_src from './data_gen.json'

const characterKey: CharacterKey = "Yoimiya"
const elementKey: ElementKey = "pyro"
const data_gen = data_gen_src as CharacterData
const [tr, charTr] = trans("char", characterKey)

const [condSkillPath, condSkill] = cond(characterKey, "skill")
const [condA1Path, condA1] = cond(characterKey, "a1")
const [condC1Path, condC1] = cond(characterKey, "c1")
const [condC2Path, condC2] = cond(characterKey, "c2")
const const3TalentInc = greaterEq(input.constellation, 3, 3)
const const5TalentInc = greaterEq(input.constellation, 5, 3)
const normal_dmgMult = matchFull(condSkill, "skill", subscript(input.total.skillIndex, datamine.skill.dmg_), 1, { key: 'normal_dmg_' })
const a1Stacks = lookup(condA1, Object.fromEntries(range(1, datamine.passive1.maxStacks).map(i => [i, constant(i)])), 0)
const pyro_dmg_ = infoMut(prod(percent(datamine.passive1.pyro_dmg_), a1Stacks), { key: 'pyro_dmg_' })
const atk_ = unequal(input.activeCharKey, characterKey, sum(percent(datamine.passive2.fixed_atk_), prod(percent(datamine.passive2.var_atk_), a1Stacks)))
const c1atk_ = equal(condC1, 'c1', percent(datamine.constellation1.atk_))
const c2pyro_dmg_ = equal(condC2, 'c2', percent(datamine.constellation2.pyro_dmg_), { key: 'pyro_dmg_' })

const canShowC6 = uiData => uiData.get(input.constellation).value >= 6 && uiData.get(condSkill).value === 'skill'

const normalEntries = datamine.normal.hitArr.map((arr, i) =>
  [i, prod(normal_dmgMult, dmgNode("atk", arr, "normal", { hit: { ele: matchFull(condSkill, "skill", constant(elementKey), constant("physical")) } }))])

const kindlingEntries = normalEntries.map(([_, node], i, arr) => [i + arr.length, (prod(prod(percent(datamine.constellation6.dmg_), percent(datamine.constellation6.chance)), node))])


export const dmgFormulas = {
  // TODO: Provide premod multiplicative damage bonuses e.g. normal_dmgMult
  normal: Object.fromEntries([...normalEntries, ...kindlingEntries]),
  charged: {
    hit: dmgNode("atk", datamine.charged.hit, "charged"),
    full: dmgNode("atk", datamine.charged.full, "charged", { hit: { ele: constant(elementKey) } }),
    kindling: dmgNode("atk", datamine.charged.kindling, "charged", { hit: { ele: constant(elementKey) } })
  },
  plunging: Object.fromEntries(Object.entries(datamine.plunging).map(([key, value]) =>
    [key, dmgNode("atk", value, "plunging")])),
  skill: {},
  burst: {
    dmg: dmgNode("atk", datamine.burst.dmg, "burst", { hit: { ele: constant(elementKey) } }),
    exp: dmgNode("atk", datamine.burst.exp, "burst", { hit: { ele: constant(elementKey) } }),
  }
}

export const dataObj = dataObjForCharacterSheet(characterKey, elementKey, "inazuma", data_gen, dmgFormulas, {
  bonus: {
    skill: const3TalentInc,
    burst: const5TalentInc,
  },
  teamBuff: {
    premod: {
      atk_,
    }
  },
  premod: {
    atk_: c1atk_,
    pyro_dmg_: sum(pyro_dmg_, c2pyro_dmg_),
  }
})

const sheet: ICharacterSheet = {
  name: tr("name"),
  cardImg: card,
  thumbImg: thumb,
  thumbImgSide: thumbSide,
  bannerImg: banner,
  rarity: data_gen.star,
  elementKey,
  weaponTypeKey: data_gen.weaponTypeKey,
  gender: "F",
  constellationName: tr("constellationName"),
  title: tr("title"),
  talent: {
    sheets: {
      auto: {
        name: tr("auto.name"),
        img: normalSrc(data_gen.weaponTypeKey),
        sections: [
          {
            text: tr("auto.fields.normal"),
            fields: datamine.normal.hitArr.map((_, i) => ({
              node: infoMut(dmgFormulas.normal[i], { key: `char_${characterKey}_gen:auto.skillParams.${i}` }),
              textSuffix: ([0, 3].includes(i)) ? st("brHits", { count: 2 }) : ""
            }))
          }, {
            text: tr("auto.fields.charged"),
            fields: [{
              node: infoMut(dmgFormulas.charged.hit, { key: `char_${characterKey}_gen:auto.skillParams.5` }),
            }, {
              node: infoMut(dmgFormulas.charged.full, { key: `char_${characterKey}_gen:auto.skillParams.6` }),
            }, {
              node: infoMut(dmgFormulas.charged.kindling, { key: `char_${characterKey}_gen:auto.skillParams.7` }),
            }]
          }, {
            text: tr(`auto.fields.plunging`),
            fields: [{
              node: infoMut(dmgFormulas.plunging.dmg, { key: "sheet_gen:plunging.dmg" }),
            }, {
              node: infoMut(dmgFormulas.plunging.low, { key: "sheet_gen:plunging.low" }),
            }, {
              node: infoMut(dmgFormulas.plunging.high, { key: "sheet_gen:plunging.high" }),
            }]
          },
        ],
      },
      skill: {
        name: tr("skill.name"),
        img: skill,
        sections: [{
          text: tr("skill.description"),
          fields: [
            {
              text: tr("skill.skillParams.1"),
              value: datamine.skill.duration,
              unit: 's'
            }, {
              text: tr("skill.skillParams.2"),
              value: datamine.skill.cd,
              unit: 's'
            }],
          conditional: {
            name: tr("skill.name"),
            path: condSkillPath,
            value: condSkill,
            states: {
              skill: {}
            }
          }
        }],
      },
      burst: {
        name: tr("burst.name"),
        img: burst,
        sections: [{
          text: tr("burst.description"),
          fields: [
            {
              node: infoMut(dmgFormulas.burst.dmg, { key: `char_${characterKey}_gen:burst.skillParams.0` }),
            },
            {
              node: infoMut(dmgFormulas.burst.exp, { key: `char_${characterKey}_gen:burst.skillParams.1` }),
            },
            {
              text: tr("burst.skillParams.2"),
              value: uiData => datamine.burst.duration + (uiData.get(input.constellation).value >= 1 ? datamine.constellation1.burst_durationInc : 0),
              unit: "s"
            }, {
              text: tr("burst.skillParams.3"),
              value: datamine.burst.cd,
              unit: "s"
            }, {
              text: tr("burst.skillParams.4"),
              value: 60,
            }]
        }],
      },
      passive1: talentTemplate("passive1", tr, passive1, [],
        {
          canShow: greaterEq(input.asc, 1, 1),
          value: condA1,
          path: condA1Path,
          name: tr("passive1.name"),
          states: Object.fromEntries(range(1, datamine.passive1.maxStacks).map(i =>
            [i, {
              name: `${i} stack`,
              fields: [
                {
                  node: pyro_dmg_
                },
                {
                  text: sgt("duration"),
                  value: datamine.passive1.duration,
                  unit: "s"
                }
              ]

            }]))
        }
      ),
      passive2: talentTemplate("passive2", tr, passive2, [{
        canShow: uiData => uiData.get(input.asc).value >= 4,
        node: infoMut(atk_, { key: `char_${characterKey}_gen:passive2.name` })
      }, {
        canShow: uiData => uiData.get(input.asc).value >= 4,
        text: sgt("duration"),
        value: datamine.passive2.duration,
        unit: "s"
      }]),
      passive3: talentTemplate("passive3", tr, passive3),
      constellation1: talentTemplate("constellation1", tr, c1, [], {
        canShow: greaterEq(input.constellation, 1, 1),
        name: charTr("c1"),
        value: condC1,
        path: condC1Path,
        states: {
          c1: {
            fields: [{
              node: constant(datamine.constellation1.atk_, { key: "atk_" })
            }, {
              text: sgt("duration"),
              value: datamine.constellation1.duration,
              unit: 's'
            }]
          }
        }
      }),
      constellation2: {
        name: tr("constellation2.name"),
        img: c2,
        sections: [{
          text: tr("constellation2.description"),
          conditional: {
            canShow: greaterEq(input.constellation, 2, 1),
            name: charTr("c2"),
            value: condC2,
            path: condC2Path,
            states: {
              c2: {
                fields: [
                  {
                    node: c2pyro_dmg_
                  }, {
                    text: sgt("duration"),
                    value: datamine.constellation2.duration,
                    unit: "s"
                  }]
              }
            }
          }
        }],
      },
      constellation3: talentTemplate("constellation3", tr, c3, [{ node: const3TalentInc }]),
      constellation4: talentTemplate("constellation4", tr, c4),
      constellation5: talentTemplate("constellation5", tr, c5, [{ node: const5TalentInc }]),
      constellation6: talentTemplate("constellation6", tr, c6, 
        datamine.normal.hitArr.map((_, i, a): INodeFieldDisplay => ({
            canShow: canShowC6,
            node: infoMut(dmgFormulas.normal[i + a.length], { key: `char_${characterKey}_gen:auto.skillParams.${i}` }),
            textSuffix: ([0, 3].includes(i)) ? st("brHits", { count: 2 }) : ""
          }))
      )
    },
  },
};

export default new CharacterSheet(sheet, dataObj);
