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
  AlignmentType, ImageRun, UnderlineType, PageNumber, Footer, VerticalAlign
} from "docx";
import {
  type Comment,
  type ExtendedServiceItem,
  Invoice,
  InvoiceItemService,
  InvoiceListItem,
  type SubTotal
} from "@/lib/types";
import logoImagePath from "../../../assets/logo.jpg";

function getHeader(bufferedImage: any, fileType: "jpg"|  "bmp"|  "gif" | "png", doctor: string, pacient: string, date: Date | string ) {

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
            verticalAlign: VerticalAlign.BOTTOM,
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph(`Дата: ${(new Date(date)).toLocaleDateString() }`)],
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
            verticalAlign: VerticalAlign.BOTTOM,
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
            verticalAlign: VerticalAlign.BOTTOM,
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
            verticalAlign: VerticalAlign.BOTTOM,
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
            verticalAlign: VerticalAlign.BOTTOM,
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

function makeProcedureLine(steps: string[], selectedTooths: string[]) {
  const toothNumbersText = selectedTooths.length > 0 ?  ` (${selectedTooths.join(", ")})` : "";
  return new Paragraph({
    children: [
      new TextRun({ text: `□    `, size: 22 }),
      new TextRun({ text: steps.join(" ⸱ "), size: 22 }),
      new TextRun({ text: toothNumbersText, size: 22 }),
    ],
  });
}

function makePriceLine(unitPrice: number, quantity: number, currency: string) {
  const total = unitPrice * quantity;
  return new Paragraph({
    children: [
      new TextRun({
        text: `Цена: ${total} ${currency} (${unitPrice} x ${quantity})`,
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
          text: "Обращаем Ваше внимание! Стоимость, указанная в настоящем плане, является предварительной и действительна в течение ",
          bold: true,
          size: 18, // 9pt
        }),
        new TextRun({
          text: "3 (трех) месяцев",
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          size: 18,
        }),
        new TextRun({
          text: " с даты составления.",
          bold: true,
          size: 18,
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
          text: "Подпись пациента: _______________",
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
    }),
  ];
}

const getAllItemsOrdered = (invoice: InvoiceListItem) => {
  const allItems: Array<{
    type: 'service' | 'subTotal' | 'comment';
    item: ExtendedServiceItem | SubTotal | Comment;
    order: number;
  }> = [
    // Всегда добавляем сервисы
    ...invoice.services.map(service => ({ type: 'service' as const, item: service, order: service.order })),

    // Добавляем subTotals только если они есть и не пустые
    ...(invoice.subTotals?.length
      ? invoice.subTotals.map(subTotal => ({ type: 'subTotal' as const, item: subTotal, order: subTotal.order }))
      : []),

    // Добавляем comments только если они есть и не пустые
    ...(invoice.comments?.length
      ? invoice.comments.map(comment => ({ type: 'comment' as const, item: comment, order: comment.order }))
      : []),
  ];

  return allItems.sort((a, b) => a.order - b.order);
};



export async function generateInvoiceWord(invoice: InvoiceListItem) {

  const response = await fetch(logoImagePath);
  const arrayBuffer = await response.arrayBuffer();
  const bufferedImage = new Uint8Array(arrayBuffer);

  const header = getHeader(bufferedImage, "jpg", `${invoice.doctor.name}${invoice.doctor.specialization?.trim() ? ` - ${  invoice.doctor.specialization}` : ""}` , invoice.patient, invoice.date)
  const footer = getFooter()

  const spacing1 = Array.from({ length: 1 }, () => new Paragraph(""));
  const spacing2 = Array.from({ length: 2 }, () => new Paragraph(""));
  const spacing3 = Array.from({ length: 3 }, () => new Paragraph(""));

  const invoiceItems: any[] = [];

  const allItems = getAllItemsOrdered(invoice)

  allItems.forEach((item) => {
    if (item.type === "service"){
      const srv = item.item as ExtendedServiceItem

      invoiceItems.push(makeProcedureLine(srv.path, srv.selectedTeeth));
      if (srv.comment) {
        invoiceItems.push(...spacing1);

        const lines = srv.comment.split("\n");
        const runs = lines.flatMap((line, i) => {
          if (i === 0) return [new TextRun({ text: line, italics: true, bold: true })]; // курсив для первой строки
          return [new TextRun({ text: line, break: 1, italics: true, bold: true })];   // курсив для остальных
        });

        invoiceItems.push(new Paragraph({ children: runs }));
      }
      if (srv.teethComments){
        invoiceItems.push(...spacing1);
        Object.entries(srv.teethComments).forEach(([tooth, comment]) => {
          invoiceItems.push(
            new Paragraph({
              children: [
                new TextRun({text:`Зуб ${tooth}: `, italics: true, bold: true}),
                new TextRun({ text: comment, italics: true, bold: true }) // курсив для комментария
              ]
            })
          );
        });
      }
      if (srv.linkedToTeeth && srv.selectedTeeth?.length > 0) {
        const teethNums = srv.selectedTeeth.map((n: string) => Number(n));
        invoiceItems.push(...spacing2)
        invoiceItems.push(createTeethTable(teethNums));
      }

      invoiceItems.push(...spacing1)
      invoiceItems.push(
        makePriceLine(srv.price, srv.quantity, "BYN")
      );
      invoiceItems.push(...spacing1);
    }
    else if (item.type === "comment"){
      const comment = item.item as Comment

      invoiceItems.push(...spacing1);
      invoiceItems.push(
        new Paragraph({
          children: [
            new TextRun({ text: comment.comment, italics: true, bold: true }) // курсив для комментария
          ]
        })
      )
      invoiceItems.push(...spacing1);
    }
    else if (item.type === "subTotal"){
      const subTotal = item.item as SubTotal
      invoiceItems.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${subTotal.subTotalName}: ${subTotal.subTotalAmount} BYN`,
              bold: true,
              size: 24
            }),
          ],
          alignment: "right", // выравнивание по правому краю
        })
      )
      invoiceItems.push(...spacing1);
    }
  })


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
        footers:{
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [
                      PageNumber.CURRENT,
                      "/",
                      PageNumber.TOTAL_PAGES
                    ],
                    bold: true,
                    size: 20,
                  }),
                ],
                alignment: "right"
              })
            ]
          })
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
          ...invoiceItems,
          ...spacing3,
          totalLine,
          ...spacing3,
          ...footer
        ],
      },
    ],
  });
  console.log("Create doc: OK")
  // Браузерный вариант:
  const blob = await Packer.toBlob(doc);
  const arrayBuf = await blob.arrayBuffer();
  const buffer = new Uint8Array(arrayBuf);
  console.log("Create buffer: OK")
  return buffer// передаём в main process для сохранения

}
