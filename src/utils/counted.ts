const units = ['', 'Ribu', 'Juta', 'Milyar', 'Triliun', 'Quadriliun', 'Quintiliun', 'Sextiliun', 'Septiliun', 'Oktiliun', 'Noniliun', 'Desiliun', 'Undesiliun', 'Duodesiliun', 'Tredesiliun', 'Quattuordesiliun', 'Quindesiliun', 'Sexdesiliun', 'Septendesiliun', 'Oktodesiliun', 'Novemdesiliun', 'Vigintiliun']
const maxIndex = units.length - 1
function digitToUnit (digit: any) {
  const curIndex = digit / 3
  return curIndex <= maxIndex ? units[curIndex] : units[maxIndex]
}

const numbers = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
function numberToText (index: any) {
  return numbers[index] || ''
}

const counted = (numb: any) => {
  const numbLength   = numb.length
  const numbMaxIndex = numbLength - 1

  // Angka Nol
  if (numbMaxIndex === 0 && Number(numb[0]) === 0) {
    return 'nol'
  }

  let space = ''
  let result = ''

  let i = 0
  while (i !== numbLength) {

    const digitCount = numbMaxIndex - i
    const modGroup = digitCount % 3 // [2,1,0]
    const curNumb = Number(numb[i])

    if (digitCount === 3 && curNumb === 1 && (i === 0 || 
      (Number(numb[i - 2]) === 0 && Number(numb[i - 1]) === 0))) {
      /* Angka Seribu */
      result += `${space}Seribu`
    } else {
      if (curNumb !== 0) {
        if (modGroup === 0) {
          /* Angka Satuan Bukan Nol */
          result += `${space}${numberToText(curNumb)}${(i === numbMaxIndex ? '' : ' ')}${digitToUnit(digitCount)}`
        } else if (modGroup === 2) {
          /* Angka Ratusan */
          if (curNumb === 1) {
            result += `${space}Seratus`
          } else {
            result += `${space}${numberToText(curNumb)} Ratus`
          }
        } else {
          /* Angka Sepuluh dan Belasan */
          if (curNumb === 1) {
            i++ // Skip Next Angka
            const nextAngka = Number(numb[i])
            if (nextAngka === 0) {
              result += `${space}Sepuluh`
              /* Proses Next Angka Sekarang */
              if (digitCount !== 1 && (Number(numb[i - 2]) !== 0 || Number(numb[i - 1]) !== 0)) {
                result += ` ${digitToUnit(digitCount - 1)}`
              }
            } else {
              if (nextAngka === 1) {
                result += `${space}Sebelas`
              } else {
                result += `${space}${numberToText(nextAngka)} Belas`
              }
              /* Proses Next Angka Sekarang */
              if (digitCount !== 1) {
                result += ` ${digitToUnit(digitCount - 1)}`
              }
            }
          } else {
            /* Angka Puluhan */
            result += `${space}${numberToText(curNumb)} Puluh`
          }
        }
      } else {
        /* Angka Satuan Nol */
        if (modGroup === 0 && (Number(numb[i - 2]) !== 0 || Number(numb[i - 1]) !== 0) && digitCount !== 0) {
          result += ` ${digitToUnit(digitCount)}`
        }
      }
    }

    if (i <= 1) {
      space = ' '
    }
    i++
  }

  return result
}

const countedBy = (numb: any) => {
  return numb
    .split('')
    .map((numb: any) => numb == 0 ? 'nol' : numberToText(numb))
    .join(' ')
}

export default function numberCounted(target: any, settings={decimal: '.'}) {
  if (typeof target !== "string") target = String(target)
  if (target.indexOf(settings.decimal) > -1) {
    /* Dengan Desimal */
    target = target.split(settings.decimal)
    return `${counted(target[0])} koma ${countedBy(target[1])}`
  } else {
    /* Tanpa Desimal */
    return counted(target)
  }
}