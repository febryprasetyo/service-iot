export default function insurancePreview({logo_lcts, logo_wika, link, wika_address, content={}}:
  {logo_lcts: string, logo_wika: string, link: string, wika_address: string, content?: any}) {
  return `
  <body style="width:100% !important; -webkit-text; size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0;">
    <table border="0" cellspacing="0" cellpadding="0" width="600" class="100p">
      <tr>
        <td align="left" class="100p">
          <img src="${logo_lcts}" alt="Logo" border="0" style="display:block" width="135" />
        </td>
        <td align="right" class="50p">
          <img src="${logo_wika}" alt="Logo" border="0" style="display:block" width="90" />
        </td>
      </tr>
    </table>
    <table>
      <tr>
        <td height="10"></td>
      </tr>
      <tr>
        <td>
          <p style="font-family:Georgia, 'Times New Roman', Times, serif;width: 280px;">
            Kepada Yth.<br>
            <b>${content.insurance_vendor}</b><br>
            ${content.insurance_address} <br>
            Telp. ${content.insurance_phone} <br>
            di Tempat
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="font-family:Georgia, 'Times New Roman', Times, serif">
            Berikut permohonan pengajuan persetujuan asuransi untuk <b>${content.shipment_name}</b>
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="font-family:Georgia, 'Times New Roman', Times, serif">
            Silahkan klik <a style="color: blue;" href="${link}" target="_blank">link</a> berikut untuk melakukan review dan pemberian keputusan.
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="font-family:Georgia, 'Times New Roman', Times, serif">Terima Kasih</p>
        </td>
      </tr>
      <tr>
        <td>
          <p style="font-family:Georgia, 'Times New Roman', Times, serif">
            ${wika_address}
          </p>
        </td>
      </tr>
    </table>
  </body>
  `
}