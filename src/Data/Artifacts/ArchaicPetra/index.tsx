import ImgIcon from '../../../Components/Image/ImgIcon'
import SqBadge from '../../../Components/SqBadge'
import { input } from '../../../Formula'
import { Data } from '../../../Formula/type'
import { match, percent, threshold_add } from '../../../Formula/utils'
import { ArtifactSetKey } from '../../../Types/consts'
import { IFieldDisplay } from '../../../Types/IFieldDisplay_WR'
import { absorbableEle } from '../../Characters/dataUtil'
import { cond, sgt, trans } from '../../SheetUtil'
import { ArtifactSheet, IArtifactSheet } from '../ArtifactSheet'
import { dataObjForArtifactSheet } from '../dataUtil'
import icons from './icons'
const key: ArtifactSetKey = "ArchaicPetra"
const [tr, trm] = trans("artifact", key)

const set2 = threshold_add(input.artSet.ArchaicPetra, 2, percent(0.2))
const [condPath, condNode] = cond(key, "element")
const set4Nodes = Object.fromEntries(absorbableEle.map(e => [`${e}_dmg_`,
threshold_add(input.artSet.ArchaicPetra, 4,
  match(e, condNode, percent(0.35))
)
]))

export const data: Data = dataObjForArtifactSheet(key, {
  premod: {
    geo_dmg_: set2,
  },
  teamBuff: {
    premod: set4Nodes
  }
}, undefined)
const durationfield: IFieldDisplay = {
  text: sgt("duration"),
  value: 10,
  unit: "s"
}

const sheet: IArtifactSheet = {
  name: "Archaic Petra", rarity: [4, 5],
  icons,
  setEffects: {
    2: { document: [{ fields: [{ node: set2 }] }] },
    4: {
      document: [{
        conditional: {
          path: condPath,
          value: condNode,
          teamBuff: true,
          header: {
            title: tr("setName"),
            icon: <ImgIcon size={2} sx={{ m: -1 }} src={icons.flower} />,
            action: <SqBadge color="success">4-set</SqBadge>
          },
          description: tr(`setEffects.4`),
          name: trm("condName"),
          states: Object.fromEntries(absorbableEle.map(e => [e, {
            name: sgt(`element.${e}`),
            fields: [{
              node: set4Nodes[`${e}_dmg_`]
            }, durationfield]
          }])),
        }
      }]
    }
  }
}
export default new ArtifactSheet(key, sheet, data)
