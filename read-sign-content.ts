/**
 * ! EM DESENVOLVIMENTO, NÃO UTILIZAR, NÃO FUNCIONAL
 * ? A proposta dessa function é verificar se há assinatura digital e acessar o conteúdo dentro dela.
 * ? diferente da proposta inicial que é somente verificar se o PDF está assinado ou não.
 */

import forge from 'node-forge'
import axios from 'axios'
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib'

const URL =
  'https://drive.google.com/uc?export=download&id=1rXgDsinLszF-s8IvFV7UMcCLc4pE0sOg'

const sut = async () => {
  const blob = (
    await axios.get(URL, {
      responseType: 'arraybuffer'
    })
  ).data
  const pdf = await PDFDocument.load(blob)
  const fields = pdf.getForm().getFields()

  for (const field of fields) {
    if (field.constructor.name === 'PDFSignature') {
      const signatureField = field
      const signatureDict = signatureField.acroField.dict
      const vRef = signatureDict.lookup(PDFName.of('V'))

      if (!vRef) {
        console.log('No /V reference found.')
        continue
      }

      const vDict = pdf.context.lookup(vRef) as PDFDict

      // @ts-ignore
      if (!vDict || !vDict.dict) {
        console.log('Invalid /V reference.')
        continue
      }

      // @ts-ignore
      const contents = vDict.dict.get(PDFName.of('Contents'))
      if (!contents) {
        console.log('No Contents found in the signature dictionary.')
        continue
      }

      const signatureContent = contents.value

      // Decode the signature content using node-forge
      const decodedContent = forge.util.decode64(signatureContent)

      try {
        // ! Error parsing PKCS#7 structure: Error: Unparsed DER bytes remain after ASN.1 parsing.
        const p7Asn1 = forge.asn1.fromDer(decodedContent, false)

        const message = forge.pkcs7.messageFromAsn1(p7Asn1)

        if (message.rawCapture) {
          // console.log('Certificates:', message.certificates)
        } else {
          console.log('No certificates found in the PKCS#7 message.')
        }
      } catch (err) {
        console.log('Error parsing PKCS#7 structure:', err)
      }
    }
  }
}

sut()
