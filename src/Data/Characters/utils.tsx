import { Translate } from "../../Components/Translate";
import { NumNode } from "../../Formula/type";
import { infoMut } from "../../Formula/utils";
import { CharacterKey } from "../../Types/consts";
import { trans } from "../SheetUtil";
import { dmgNode } from "./dataUtil";

type ComboRange = [number, number]
type Multiplier = [number, number]

/**
 * Normal hit array
 * @param normals The aray of hit dmg arrays for normal attacks
 * @param combo Indices to be grouped as part of a multihit combo
 */
export function mapNormals(characterKey: CharacterKey, normals: number[][], combos?: ComboRange[], multipliers?: Multiplier[]) {
  const [tr] = trans("char", characterKey)
  const formula: Record<number, NumNode> = Object.fromEntries(normals.map((arr, i) =>
    [i, dmgNode("atk", arr, "normal")]))
  const display:{
    normalIndex: number,
    autoNumber: number, 
    comboNumber?: number, 
    comboMultiplier?: number
  }[] = []

  let autoNumber = 0
  let combo: ComboRange | null = null
  for (let normalIndex = 0; normalIndex < normals.length; normalIndex++) {
    const comboStart = combos?.find(([start, _]) => start === normalIndex)
    const comboEnd = combos?.find(([_, end]) => end === normalIndex)
    if (comboStart) combo = comboStart
    if (comboEnd) combo = null

    let entry: typeof display[number] = {
      normalIndex,
      autoNumber
    }

    if (combo !== null) {
      const [start, end] = combo
      if (normalIndex === start) {
        const comboNormals = normals.slice(start, end)
        console.log(comboNormals)
        const areAllDuplicates = comboNormals.every((arr, i) => arr.every((v, j) => v === comboNormals[0][j]))
        if (areAllDuplicates) {
          // skip duplicates, set multiplier on current entry
          entry.comboMultiplier = end - start
          normalIndex = end - 1
          autoNumber++
          combo = null
        }
      }
      if (!entry.comboMultiplier) {
        entry.comboNumber = normalIndex - start + 1
      }
      if (normalIndex === end - 1) {
        autoNumber++
      }
    } else {
      autoNumber++
    }

    const multiplier = multipliers?.find(([index, _]) => index === normalIndex)
    if (multiplier) {
      const [_, comboMultiplier] = multiplier
      entry.comboMultiplier = comboMultiplier
    }

    display.push(entry)
  }
  console.log(...display)

  const section = {
    text: tr("auto.fields.normal"),
    fields: display.map(({normalIndex, autoNumber, comboMultiplier, comboNumber}) => {
      let textSuffix = ''
      if (comboMultiplier) {
        textSuffix = `(${comboMultiplier} Hits)`
      } else if (comboNumber) {
        textSuffix = `(${comboNumber})`
      }

      return ({
        node: infoMut(formula[normalIndex], { key: `char_${characterKey}_gen:auto.skillParams.${autoNumber}` }),
        textSuffix
      })
    })
  }

  return {formula, section}
}