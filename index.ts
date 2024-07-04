import axios from 'axios'
import { PDFDocument } from 'pdf-lib'

type Response = {
  ACTION: 'VALIDAR_DOC'
  link_documento: string
}

const verifySignedPDF = async (pdfUrl: string): Promise<Response | {}> => {
  try {
    const blob = (
      await axios.get(pdfUrl, {
        responseType: 'arraybuffer'
      })
    ).data
    const pdf = await PDFDocument.load(blob)
    const fields = pdf.getForm().getFields()

    const hasSignature = fields.some(
      (field) => field.constructor.name === 'PDFSignature'
    )

    if (hasSignature) {
      return {
        ACTION: 'VALIDAR_DOC',
        link_documento: URL
      }
    } else {
      return {}
    }
  } catch (error: any) {
    console.log(error)

    return { error }
  }
}

verifySignedPDF(
  'https://drive.google.com/uc?export=download&id=1rXgDsinLszF-s8IvFV7UMcCLc4pE0sOg'
)
