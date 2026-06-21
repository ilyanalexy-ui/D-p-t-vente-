import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const LOGO_B64 = "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"

export async function POST(req: NextRequest) {
  try {
    const { deposant, article, cagnotte, email } = await req.json()

    if (!email) return NextResponse.json({ error: 'Email manquant' }, { status: 400 })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: 'NH Dépôt-Vente <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Votre article a été vendu !',
      html: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Votre article a été vendu</title>
</head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- LOGO -->
        <tr><td align="center" style="padding-bottom:32px;">
          <img src="data:image/jpeg;base64,${LOGO_B64}" alt="NH Dépôt-Vente" width="80" height="80" style="border-radius:12px;display:block;" />
          <div style="font-size:13px;font-weight:600;letter-spacing:0.08em;color:#8A8A82;margin-top:10px;text-transform:uppercase;">Dépôt-Vente</div>
        </td></tr>

        <!-- CARD PRINCIPALE -->
        <tr><td style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.06);">

          <!-- Header vert -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#1A1A1A;padding:36px 40px;text-align:center;">
              <div style="font-size:40px;margin-bottom:14px;">🎉</div>
              <div style="font-size:26px;font-weight:800;color:white;letter-spacing:-0.02em;margin-bottom:6px;">Article vendu !</div>
              <div style="font-size:15px;color:#888;font-weight:400;">Bonne nouvelle, ${deposant}</div>
            </td></tr>
          </table>

          <!-- Contenu -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px;">

              <p style="font-size:15px;color:#4A4A4A;line-height:1.7;margin:0 0 28px;">
                Votre article a trouvé preneur. Voici le récapitulatif de cette vente.
              </p>

              <!-- Article vendu -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr><td style="background:#F5F3EE;border-radius:12px;padding:20px 24px;border-left:3px solid #1A1A1A;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#A8A8A0;margin-bottom:6px;">Article vendu</div>
                  <div style="font-size:18px;font-weight:800;color:#1A1A1A;">${article}</div>
                </td></tr>
              </table>

              <!-- Cagnotte -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="background:#ECFDF5;border-radius:12px;padding:24px;text-align:center;border:1px solid #D1FAE5;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#059669;margin-bottom:8px;">Votre cagnotte totale</div>
                  <div style="font-size:42px;font-weight:900;color:#059669;letter-spacing:-0.03em;line-height:1;">${cagnotte} €</div>
                  <div style="font-size:13px;color:#065F46;margin-top:10px;line-height:1.5;">Vous recevrez bientôt votre virement<br>sur votre compte bancaire.</div>
                </td></tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr><td style="border-top:1px solid #F0EFEC;"></td></tr>
              </table>

              <p style="font-size:13px;color:#A8A8A0;line-height:1.7;margin:0;text-align:center;">
                Merci de nous faire confiance pour la vente de vos articles.<br>
                N'hésitez pas à nous confier d'autres pièces !
              </p>

            </td></tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#F5F3EE;padding:20px 40px;text-align:center;border-top:1px solid #E8E7E3;">
              <div style="font-size:12px;color:#B8B8B0;line-height:1.6;">
                <strong style="color:#6B6B63;">NH Dépôt-Vente</strong> · Marseille<br>
                Cet email a été envoyé automatiquement suite à la vente de votre article.
              </div>
            </td></tr>
          </table>

        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    if (error) return NextResponse.json({ error }, { status: 400 })
    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
