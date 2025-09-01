import {
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  AlignmentType, ImageRun
} from "docx";
import logoImagePath from "../../../assets/logo.jpg";
import { Invoice, InvoiceItemService } from "@/lib/types";

export async function generateInvoiceWord(invoice: Invoice) {

  const response = await fetch(logoImagePath);
  const arrayBuffer = await response.arrayBuffer();
  const bufferedImage = new Uint8Array(arrayBuffer);

  const header = getHeader(bufferedImage, "jpg", `${invoice.selectedDoctor.name} - ${invoice.selectedDoctor.specialization}` , invoice.patientName, invoice.date)
  const footer = getFooter()
  //const table = createTeethTable([12, 43]);

  const spacing1 = Array.from({ length: 1 }, () => new Paragraph(""));
  const spacing2 = Array.from({ length: 2 }, () => new Paragraph(""));
  const spacing3 = Array.from({ length: 3 }, () => new Paragraph(""));

  const procedures: any[] = [];
  invoice.services.forEach((srv: InvoiceItemService, idx: number) => {
    procedures.push(makeProcedureLine(idx + 1, srv.path, srv.selectedTeeth));

    if (srv.comment) {
      procedures.push(...spacing1);
      procedures.push(new Paragraph("Комментарий врача:"));

      // Разбиваем по переносам
      const lines = srv.comment.split("\n");
      const runs = lines.flatMap((line, idx) => {
        if (idx === 0) return [new TextRun(line)];
        return [new TextRun({ text: line, break: 1 })];
      });

      procedures.push(new Paragraph({ children: runs }));
    }

    if (srv.linkedToTeeth && srv.selectedTeeth?.length > 0) {
      const teethNums = srv.selectedTeeth.map((n: string) => Number(n));
      procedures.push(...spacing2)
      procedures.push(createTeethTable(teethNums));
    }

    procedures.push(...spacing1)
    procedures.push(
      makePriceLine(srv.price, srv.quantity, "BYN")
    );
    procedures.push(...spacing2);
  });

  // Итоговая сумма
  const totalLine = new Paragraph({
    children: [
      new TextRun({
        text: `ИТОГО: ${invoice.totalAmount} BYN`,
        bold: true,
        size: 28,
      }),
    ],
    alignment: "right",
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Aptos"
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 720 = 0.5 inch = ~1.27 см
              right: 720,
              bottom: 720,
              left: 720,
            },

          }
        },
        children: [
          header,
          ...spacing3,
          new Paragraph({
            children: [
              new TextRun({
                text: "ПРЕДВАРИТЕЛЬНЫЙ ПЛАН ЛЕЧЕНИЯ",
                bold: true,
                size: 24,
              }),
            ],
            alignment: "center",
          }),
          ...spacing2,
          ...procedures,
          ...spacing3,
          totalLine,
          ...spacing3,
          ...footer
        ],
      },
    ],
  });

  // Браузерный вариант:
  const blob = await Packer.toBlob(doc);
  const arrayBuf = await blob.arrayBuffer();
  return new Uint8Array(arrayBuf); // передаём в main process для сохранения

}

function getHeader(bufferedImage: any, fileType: "jpg"|  "bmp"|  "gif" | "png", doctor: string, pacient: string, date: Date ) {

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, // на всю ширину
    alignment: AlignmentType.CENTER,
    borders: {
      top: { size: 0, style: BorderStyle.NONE },
      bottom: { size: 0, style: BorderStyle.NONE },
      left: { size: 0, style: BorderStyle.NONE },
      right: { size: 0, style: BorderStyle.NONE },
      insideVertical: { size: 0, style: BorderStyle.NONE },
      insideHorizontal: { size: 0, style: BorderStyle.NONE }
    },
    rows: [
      // 1 строка: "Дата" + ЛОГО (colSpan=2)
      new TableRow({
        height: { value: 500, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph(`Дата: ${date.toLocaleDateString()}`)],
            borders: {bottom: {size: 1, style: "dotted"}},
          }),
          new TableCell({
            rowSpan: 3,
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: fileType,
                    data: bufferedImage,
                    transformation: {
                      height: 100, // высота в pt (подбери под свою таблицу)
                      width: 240
                    }
                  }),
                ],
                alignment: "right", // чтобы по центру в ячейке
              }),
            ],
          }),
        ],
      }),

      // 2 строка: "Врач" + контактная инфа (rowSpan=3)
      new TableRow({
        height: { value: 500, rule: "atLeast" },
        children: [
          new TableCell({
            children: [new Paragraph("Врач:")],
            borders: {bottom: {size: 1, style: "dotted"}},
          }),
        ],
      }),

      // 3 строка: пустая dotted
      new TableRow({
        height: { value: 500, rule: "atLeast" },
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({
                  text: doctor,
                  size: 24, // размер 14 pt → в docx нужно умножить на 2
                }),
              ],
            })],
            borders: {bottom: {size: 1, style: "dotted"}}
          }),

        ],
      }),

      // 4 строка: "Пациент"
      new TableRow({
        height: { value: 500, rule: "atLeast" },
        children: [
          new TableCell({
            children: [new Paragraph("Пациент:")],
            borders: {bottom: {size: 1, style: "dotted"}}
          }),
          new TableCell({
            rowSpan: 2,
            children: [
              new Paragraph({
                text: "г. Минск, ул. Мясникова, д. 35",
                alignment: "right",
              }),
              new Paragraph({
                text: "многоканальный: +375293353500",
                alignment: "right",
              }),
              new Paragraph({
                text: "Telegram, Viber, WhatsApp: +375291473500",
                alignment: "right",
              }),
              new Paragraph({
                text: "www.perfectsmile.by",
                alignment: "right",
              }),
            ],
          }),
        ],
      }),

      // 5 строка: пустая dotted
      new TableRow({
        height: { value: 500, rule: "atLeast" },
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [
                new TextRun({
                  text: pacient,
                  size: 24, // размер 14 pt → в docx нужно умножить на 2
                }),
              ],
            })],
            borders: {bottom: {size: 1, style: "dotted"}}
          }),
        ],
      }),
    ],
  });
}

function makeProcedureLine(index: number, steps: string[], selectedTooths: string[]) {
  const toothNumbersText = selectedTooths.length > 0 ?  ` (${selectedTooths.join(", ")})` : "";
  return new Paragraph({
    children: [
      new TextRun({ text: `${index}. `, bold: true, size: 22 }),
      new TextRun({ text: steps.join(" ⸱ "), bold: true, size: 22 }),
      new TextRun({ text: toothNumbersText, bold: true, size: 22 }),
    ],
  });
}

function makePriceLine(unitPrice: number, quantity: number, currency: string) {
  const total = unitPrice * quantity;
  return new Paragraph({
    children: [
      new TextRun({
        text: `Цена: ${total} ${currency} (${unitPrice} x ${quantity})`,
        bold: true,
      }),
    ],
    alignment: "right", // выравнивание по правому краю
  });
}

function createTeethTable(highlighted: number[] = []) {
  // Списки зубов по FDI
  const upperRow = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRow = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  // хелпер для ячейки зуба
  const makeToothCell = (num: number, isLastLeft = false) => {
    const isHighlighted = highlighted.includes(num);

    return new TableCell({
      borders: {
        left: isHighlighted ? {size: 1, style: BorderStyle.INSET} : { size: 0, style: BorderStyle.NONE },
        top: isHighlighted ? {size: 1, style: BorderStyle.INSET} : { size: 0, style: BorderStyle.NONE },
        bottom: isHighlighted ? {size: 1, style: BorderStyle.INSET} : { size: 0, style: BorderStyle.NONE },
        right: isLastLeft || isHighlighted ? { size: 1, style: BorderStyle.INSET } : { size: 0, style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          text: String(num),
          alignment: "center",
        }),
      ],
      shading: isHighlighted
        ? { type: ShadingType.CLEAR, color: "auto", fill: "FFD966" } // красивый жёлтый фон
        : undefined,
    });
  };

  // генерация двух рядов
  const makeRow = (teeth: number[]) =>
    new TableRow({
      height: { value: 350, rule: "atLeast" },
      children: teeth.map((num, idx) =>
        makeToothCell(num, idx === 7) // отделяем середину между 11 и 21, 41 и 31
      ),
    });

  return new Table({
    width: { size: 8000, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    borders: {
      top: { size: 0, style: BorderStyle.NONE },
      bottom: { size: 0, style: BorderStyle.NONE },
      left: { size: 0, style: BorderStyle.NONE },
      right: { size: 0, style: BorderStyle.NONE },
      insideVertical: { size: 0, style: BorderStyle.NONE },
    },
    rows: [makeRow(upperRow), makeRow(lowerRow)],
  });
}


export function getFooter(): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Обращаем Ваше внимание! Стоимость, указанная в настоящем плане, является предварительной и действительна в течение 6 (шести) месяцев с даты составления.",
          size: 18, // 9pt (по умолчанию 24 = 12pt)
        }),
      ],
      spacing: { after: 200 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "С планом лечения ознакомлен(а). Осознаю, что стоимость лечения является ориентировочной и может изменяться в зависимости от динамики клинической ситуации, применяемых материалов, методов лечения, а также иных факторов, влияющих на себестоимость услуг.",
          size: 18,
        }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Подпись пациента: _______________    Дата:________________",
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
    }),
  ];
}
