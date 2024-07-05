/**
 * ? A proposta dessa function é verificar se há assinatura digital e acessar o conteúdo dentro dela.
 * ? diferente da proposta inicial que é somente verificar se o PDF está assinado ou não.
 *
 * ! Pelo fato da assinatura digital ser criptografada pelo órgão emissor com um certificado que não temos acesso,
 * ! é impossível que consigamos descriptografar 100% do conteúdo dessa assinatura.
 * ! A proposta de uma A.D. é exatamente garantir que os dados não possam ser adulterados.
 *
 * Informações do A.D. do gov.br:
 * Estruturação dos dados: ASN.1
 * Criptografia: Chave Pública Assimétrica
 * Encapsulamento: PKCS#7
 *
 * Resultado: Parcialmente descriptografado, requer mais testes. Consegui pegar alguns dados importantes como
 * emissor, nome da pessoa que assinou e e-mail (em uma string que não é 100% legível, requer manipulação)
 */

import axios from 'axios'
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib'

const sut = async (pdfUrl: string) => {
  try {
    const blob = (
      await axios.get(pdfUrl, {
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
        const hexData = signatureContent.toString('hex')
        const hexToBytes = Buffer.from(hexData, 'hex')

        console.log(hexToBytes.toString('utf8'))

        return {
          ACTION: 'VALIDAR_DOC',
          link_documento: pdfUrl
        }
      }
    }
  } catch (error) {
    console.log(error)

    return { error }
  }
}

sut(
  'https://drive.google.com/uc?export=download&id=1rXgDsinLszF-s8IvFV7UMcCLc4pE0sOg'
)
