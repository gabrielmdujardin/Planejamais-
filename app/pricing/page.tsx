import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
        <p className="text-xl text-gray-600">
          Escolha o plano perfeito para suas necessidades de organização de eventos
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Plano Gratuito */}
        <div className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 bg-white">
            <h3 className="text-lg font-semibold mb-2">Gratuito</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">R$ 0</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-gray-600 mb-6">Perfeito para começar a organizar eventos simples</p>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Começar grátis
              </Button>
            </Link>
          </div>
          <div className="p-6 bg-gray-50 border-t">
            <p className="font-medium mb-4">Inclui:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Até 3 eventos ativos</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Até 20 convidados por evento</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Gerenciamento básico de itens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Convites por email</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Plano Pro */}
        <div className="border rounded-xl overflow-hidden shadow-md relative">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            POPULAR
          </div>
          <div className="p-6 bg-white">
            <h3 className="text-lg font-semibold mb-2">Pro</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">R$ 19,90</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-gray-600 mb-6">Ideal para quem organiza eventos com frequência</p>
            <Link href="/register">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Começar agora</Button>
            </Link>
          </div>
          <div className="p-6 bg-gray-50 border-t">
            <p className="font-medium mb-4">Tudo do plano Gratuito, mais:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Eventos ilimitados</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Até 100 convidados por evento</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Gerenciamento avançado de itens</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Convites personalizados</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Integração com WhatsApp</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Lembretes automáticos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Plano Empresarial */}
        <div className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-6 bg-white">
            <h3 className="text-lg font-semibold mb-2">Empresarial</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold">R$ 49,90</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-gray-600 mb-6">Para empresas e eventos profissionais</p>
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                Fale conosco
              </Button>
            </Link>
          </div>
          <div className="p-6 bg-gray-50 border-t">
            <p className="font-medium mb-4">Tudo do plano Pro, mais:</p>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Convidados ilimitados</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Múltiplos organizadores</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Integração com sistemas de pagamento</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Relatórios e análises</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />
                <span>API para integrações personalizadas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Perguntas Frequentes</h2>
        <div className="space-y-6 text-left">
          <div>
            <h3 className="text-lg font-medium mb-2">Posso mudar de plano a qualquer momento?</h3>
            <p className="text-gray-600">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor
              imediatamente.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Como funciona o período de teste?</h3>
            <p className="text-gray-600">
              Oferecemos 14 dias de teste gratuito para o plano Pro. Você não precisa fornecer dados de pagamento para
              começar o teste.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Quais métodos de pagamento são aceitos?</h3>
            <p className="text-gray-600">
              Aceitamos cartões de crédito, débito, boleto bancário e PIX para pagamentos mensais ou anuais.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-gray-600">
              Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais. Seu acesso continuará até
              o final do período pago.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-emerald-50 rounded-xl p-8 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Ainda tem dúvidas?</h2>
          <p className="text-gray-600">Nossa equipe está pronta para ajudar você a escolher o plano ideal.</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Entre em contato
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Experimente grátis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
