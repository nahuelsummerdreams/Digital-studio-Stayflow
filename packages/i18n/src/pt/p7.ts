/** Portuguese (Brazil), the in-app help (interface texts and the how-to topics). Keys and {placeholders} must match es.ts exactly. */
export const ptP7 = {
  help: {
    ui: {
      open: "Abrir a ajuda",
      close: "Fechar a ajuda",
      title: "Ajuda",
      hello: "Olá, eu ajudo você a usar o aplicativo. Escolha um tema ou escreva sua pergunta.",
      placeholder: "Como faço para…?",
      send: "Enviar",
      popular: "Temas frequentes",
      you: "Você",
      thinking: "Pensando…",
      steps: "Passos",
      goThere: "Ir para esta tela",
      related: "Talvez você precise",
      noMatch: "Não encontrei uma resposta exata. Tente com outras palavras ou escolha um destes temas.",
      aiLabel: "Resposta gerada por IA. Ela pode errar: em caso de dúvida, confira a tela ou escreva para nós.",
      aiError: "Não consegui responder agora. Escolha um tema da lista ou tente novamente.",
      limit: "Você atingiu o limite de perguntas de hoje. Os temas da lista continuam disponíveis.",
      contact: "Falar com o suporte",
      back: "Voltar aos temas",
    },
    topics: {
      addProperty: {
        title: "Adicionar uma propriedade",
        steps: "Entre em Propriedades.|Escreva o nome (e a cidade, se quiser).|Toque em Adicionar propriedade.|Opcional: envie uma foto de capa.",
        keywords: "propriedade,hospedagem,apartamento,casa,chalé,quarto,adicionar,criar,nova,cadastrar",
      },
      newBooking: {
        title: "Cadastrar uma reserva",
        steps: "Toque em Nova reserva (no alto, à direita) ou em um dia livre no Calendário.|Escolha a propriedade, o nome do hóspede, a chegada e a saída.|Informe o valor total e, se já pagou algo, o valor recebido.|Toque em Adicionar reserva. Se as datas conflitarem com outra reserva, não deixa salvar.",
        keywords: "reserva,reservar,hóspede,chegada,saída,datas,nova reserva,adicionar reserva,cadastrar",
      },
      recordPayment: {
        title: "Registrar um recebimento (sinal ou saldo)",
        steps: "Entre em Reservas e encontre a reserva.|Toque em Registrar pagamento, informe o valor e escolha a forma (dinheiro, transferência, cartão…).|Salve. Você também pode tocar em Recebido por completo.|O que foi recebido fica no histórico da reserva. O aplicativo registra recebimentos: não processa pagamentos.",
        keywords: "recebimento,receber,pagamento,pagou,sinal,saldo,adiantamento,dinheiro,transferência,registrar pagamento",
      },
      dueDates: {
        title: "Datas limite do sinal e do saldo",
        steps: "Ao criar ou editar uma reserva, preencha Data limite do sinal e Data limite do saldo (são opcionais).|Enquanto nada foi recebido vale a data do sinal; depois, a do saldo.|Quando a data passa e falta receber, a reserva aparece como Vencido no Início e nos alertas.",
        keywords: "data limite,vence,vencido,vencimento,sinal,saldo,prazo,quando paga,lembrete,atrasado",
      },
      whoOwes: {
        title: "Ver quem me deve e quanto",
        steps: "Abra o Início.|O cartão A receber mostra o total e, reserva por reserva, quem deve, quanto pagou, quanto falta e quando chega.|Toque numa linha para abrir a reserva e registrar o recebimento.",
        keywords: "devem,deve,dívida,a receber,saldo pendente,quanto falta,inadimplentes,quem me deve,pendente",
      },
      calendar: {
        title: "Usar o calendário (semana e mês)",
        steps: "Entre em Calendário.|Alterne entre Semana e Mês no alto; use as setas e Hoje para se mover.|Toque num dia livre para reservá-lo ou numa barra para ver o detalhe.|Na visão semanal cada barra mostra quanto o hóspede deve.",
        keywords: "calendário,semana,mês,ocupação,ocupado,livre,cronograma,visão",
      },
      blockDates: {
        title: "Bloquear datas",
        steps: "No Calendário toque em Bloquear datas.|Escolha a propriedade, de e até, e o motivo (manutenção, uso próprio…).|Toque em Bloquear. Essas datas não aceitam reservas nem contam como ocupação.",
        keywords: "bloquear,bloqueio,manutenção,uso próprio,indisponível,fechar datas",
      },
      syncCalendars: {
        title: "Sincronizar com Airbnb e Booking",
        steps: "Entre em Configurações.|Em Sincronização cole o link de calendário (iCal) do Airbnb, Booking ou VRBO e salve.|Toque em Sincronizar agora. Também sincroniza ao abrir o aplicativo.|Copie Seu link para outras plataformas e cole lá para bloquear suas datas.|Não é instantâneo nem um channel manager: confira as datas antes de confirmar uma reserva.",
        keywords: "sincronizar,airbnb,booking,vrbo,ical,calendário externo,importar,link,reserva dupla",
      },
      importHistory: {
        title: "Trazer meu histórico de reservas",
        steps: "Baixe suas reservas em CSV (Airbnb: Menu → Reservas → Exportar; Booking: Extranet → Reservas → Baixar).|Em Configurações, toque em Escolher arquivo CSV.|Confira a prévia e o formato de data, escolha a propriedade e toque em Importar.",
        keywords: "importar,histórico,csv,excel,arquivo,reservas anteriores,migrar",
      },
      cleaning: {
        title: "Limpeza automática quando um hóspede sai",
        steps: "Cada saída de hóspedes cria sozinha uma limpeza em Operações.|Veja Hoje para o urgente e Serviços para tudo.|Se a saída mudar, a limpeza se move; se a reserva for cancelada, ela é removida.|Você pode mudar os passos em Listas de controle.",
        keywords: "limpeza,limpar,tarefa,saída,checklist,lista de controle,serviço,operações",
      },
      staffLink: {
        title: "Passar serviços para minha equipe de limpeza",
        steps: "Em Operações → Equipe de campo adicione a pessoa (nome e telefone).|Atribua serviços a ela.|Copie o link privado dela ou envie por WhatsApp.|Ela abre pelo celular, vê só os serviços dela e vai marcando. Não precisa de conta.",
        keywords: "equipe,equipe de limpeza,funcionário,link privado,whatsapp,atribuir,responsável,faxineira,sem conta,passar serviços",
      },
      maintenance: {
        title: "Manutenções que se repetem",
        steps: "Entre em Operações → Manutenção.|Escreva o que é (filtros, extintores, dedetização…), a cada quantos dias e a primeira data.|Uma semana antes da data ela vira um serviço no seu dia.",
        keywords: "manutenção,repetir,periódico,filtros,extintores,dedetização,lembrete,reparo",
      },
      expenses: {
        title: "Registrar uma despesa ou uma receita extra",
        steps: "Entre em Finanças → Receitas e despesas.|Escolha Despesa (ou Receita), a propriedade, o valor, a data e a categoria.|Toque em Adicionar.|Os recebimentos das suas reservas já entram sozinhos: em Receita lance só outras receitas para não contá-las duas vezes.",
        keywords: "despesa,despesas,receita,custo,comprovante,registrar despesa,extra,categoria",
      },
      fixedCosts: {
        title: "Despesas fixas que se repetem todo mês",
        steps: "Entre em Finanças → Despesas fixas.|Cadastre uma só vez internet, seguro, condomínio ou aluguel com o valor e o dia do mês.|Elas são registradas sozinhas todo mês.",
        keywords: "despesas fixas,mensal,internet,seguro,condomínio,aluguel,recorrente,todo mês",
      },
      financeNumbers: {
        title: "Como meus números são calculados",
        steps: "A receita é o que você recebeu das suas reservas, na data em que registrou cada recebimento, mais as receitas que você lançou manualmente.|O Resultado do mês é o recebido menos as despesas.|A receber é o que ainda falta receber das reservas ativas.",
        keywords: "lucro,resultado,recebido,faturado,margem,receitas,números,relatório,finanças,rentabilidade",
      },
      guestGuide: {
        title: "Criar o guia digital com QR code",
        steps: "Entre em Guia do hóspede e escolha a propriedade → Criar guia.|Preencha Wi-Fi, check-in, regras e recomendações (você pode carregar um texto sugerido).|Toque em Publicar.|Copie o link ou baixe o QR para imprimir. O hóspede não precisa de conta.",
        keywords: "guia,qr,wifi,hóspede,boas-vindas,check-in,regras,recomendações,publicar",
      },
      guests: {
        title: "Ver meus hóspedes e suas observações",
        steps: "Entre em Hóspedes: o diretório se monta sozinho com as suas reservas.|Abra uma ficha para ver as estadias e adicionar preferências, observações, etiquetas ou marcar como VIP.",
        keywords: "hóspedes,clientes,ficha,vip,observações,preferências,histórico,diretório",
      },
      messages: {
        title: "Enviar mensagens prontas aos meus hóspedes",
        steps: "Entre em Mais → Mensagens.|Escolha a reserva e a mensagem (boas-vindas, antes da chegada, lembrete de saída, agradecimento).|Ela sai com o nome, as datas e o link do seu guia. Copie ou abra no WhatsApp ou e-mail.",
        keywords: "mensagens,modelo,whatsapp,e-mail,boas-vindas,lembrete,comunicação",
      },
      team: {
        title: "Convidar alguém para a minha conta",
        steps: "Entre em Equipe → Convidar alguém.|Informe o e-mail e escolha o papel: Administrador, Operador ou Somente leitura.|Copie o link ou abra o rascunho de e-mail e envie você mesmo (o aplicativo não envia e-mails por você).|A pessoa deve entrar com esse mesmo e-mail.",
        keywords: "equipe,convidar,sócio,contador,papel,permissões,administrador,operador,somente leitura,usuário",
      },
      language: {
        title: "Mudar o idioma",
        steps: "Entre em Configurações: o idioma vem primeiro.|Escolha English, Español ou Português. Fica salvo neste navegador.|O que você mesmo escreve (guias, mensagens, notas) fica no idioma em que você escrever.",
        keywords: "idioma,language,inglês,english,espanhol,português,traduzir,mudar idioma",
      },
      installApp: {
        title: "Instalar o aplicativo no celular ou no computador",
        steps: "No Chrome ou Edge: toque no ícone de instalar na barra de endereços (ou Menu → Instalar aplicativo).|No iPhone (Safari): Compartilhar → Adicionar à Tela de Início.|No Android: Menu → Instalar aplicativo.|Ele abre com seu próprio ícone, como qualquer app.",
        keywords: "instalar,app,aplicativo,celular,pwa,tela de início,móvel,baixar",
      },
      limits: {
        title: "O que o aplicativo não faz",
        steps: "Não é um channel manager: Airbnb e Booking sincronizam por calendário (iCal), com possível atraso.|Não processa pagamentos: registra os recebimentos que você já fez.|Ainda não inclui inteligência artificial para gerenciar suas reservas.|Aluguel por temporada é a categoria mais testada; hotéis e hostels ainda estão em desenvolvimento.",
        keywords: "não faz,limitações,channel manager,pagamentos,cartão,inteligência artificial,hotel,hostel,pode,funciona",
      },
      activate: {
        title: "Ativar minha licença",
        steps: "Entre e crie seu negócio.|Na tela de ativação cole o código de licença que você recebeu com a compra (começa com SF-).|Toque em Ativar. Fica ativa na hora e não expira.",
        keywords: "licença,código,ativar,comprar,sf-,acesso,ativação",
      },
      deleteAccount: {
        title: "Excluir minha conta",
        steps: "Abra seu perfil (no alto, à direita) → Sua conta.|Desça até Excluir minha conta, digite a palavra de confirmação e toque no botão.|Sua conta e os negócios que são só seus são apagados. Não é possível desfazer.",
        keywords: "excluir conta,apagar conta,encerrar conta,dados,privacidade,cancelar",
      },
      reports: {
        title: "Tirar o relatório mensal em PDF",
        steps: "Entre em Mais → Relatórios.|Escolha o mês com as setas e confira o fechamento por propriedade.|Toque em Imprimir ou salvar PDF.",
        keywords: "relatório,pdf,mensal,imprimir,fechamento,resumo",
      },
    },
  },
} as const;
