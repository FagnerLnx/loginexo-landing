export const onRequestPost = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const formData = await request.formData();
    // Pegando os nomes exatos do seu index.html
    const nome = formData.get('name');
    const email = formData.get('email');
    const planilha = formData.get('upload');

    if (!nome || !email || !planilha) {
      return new Response(JSON.stringify({ error: 'Dados incompletos no formulário.' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const arrayBuffer = await planilha.arrayBuffer();
    const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Envio para o Resend usando a sua variável de ambiente
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'LogiNexo <onboarding@resend.dev>', // Use onboarding para teste inicial
        to: 'suporte@loginexo.com.br',
        subject: `Novo Diagnóstico: ${nome}`,
        html: `<p><strong>Nome:</strong> ${nome}</p><p><strong>E-mail:</strong> ${email}</p>`,
        attachments: [{ filename: planilha.name, content: base64String }]
      })
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      return new Response(JSON.stringify({ error: 'Erro no Resend', details: errorData }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro no servidor', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
