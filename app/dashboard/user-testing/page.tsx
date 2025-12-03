"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Play, User, Clock, CheckCircle2, XCircle, TrendingUp, Users, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  name: string
  role: "admin" | "analyst" | "user"
  experience: "beginner" | "intermediate" | "advanced"
  description: string
}

interface TestScenario {
  id: string
  title: string
  description: string
  tasks: string[]
  expectedTime: number
  difficulty: "easy" | "medium" | "hard"
}

interface TestResult {
  id: string
  scenarioId: string
  userId: string
  completed: boolean
  timeSpent: number
  usabilityScore: number
  comments: string
  timestamp: string
}

const userProfiles: UserProfile[] = [
  {
    id: "admin-1",
    name: "Ana Silva - Administrador",
    role: "admin",
    experience: "advanced",
    description: "Gerente de eventos com 5 anos de experiência",
  },
  {
    id: "analyst-1",
    name: "Carlos Oliveira - Analista",
    role: "analyst",
    experience: "intermediate",
    description: "Analista de dados com foco em relatórios",
  },
  {
    id: "user-1",
    name: "Maria Santos - Usuário Final",
    role: "user",
    experience: "beginner",
    description: "Organizador de eventos iniciante",
  },
  {
    id: "analyst-2",
    name: "João Pereira - Analista Sênior",
    role: "analyst",
    experience: "advanced",
    description: "Especialista em Business Intelligence",
  },
  {
    id: "user-2",
    name: "Paula Costa - Usuário",
    role: "user",
    experience: "intermediate",
    description: "Coordenadora de eventos corporativos",
  },
]

const testScenarios: TestScenario[] = [
  {
    id: "scenario-1",
    title: "Criação de Novo Evento",
    description: "Criar um evento do zero com todos os detalhes necessários",
    tasks: [
      "Acessar o dashboard",
      "Clicar em 'Novo Evento'",
      "Preencher informações básicas",
      "Adicionar convidados",
      "Salvar evento",
    ],
    expectedTime: 5,
    difficulty: "easy",
  },
  {
    id: "scenario-2",
    title: "Análise de Dados no Dashboard",
    description: "Navegar pelos gráficos e extrair insights relevantes",
    tasks: ["Acessar a página de Analytics", "Aplicar filtros de data", "Identificar tendências", "Exportar relatório"],
    expectedTime: 8,
    difficulty: "medium",
  },
  {
    id: "scenario-3",
    title: "Gerenciamento de Convidados",
    description: "Adicionar, editar e confirmar status de múltiplos convidados",
    tasks: [
      "Abrir evento existente",
      "Adicionar 5 novos convidados",
      "Editar informações de 2 convidados",
      "Enviar convites",
      "Confirmar status",
    ],
    expectedTime: 10,
    difficulty: "medium",
  },
  {
    id: "scenario-4",
    title: "Configuração de Filtros Avançados",
    description: "Utilizar todos os filtros disponíveis para segmentar dados",
    tasks: [
      "Acessar Visualização de Dados",
      "Aplicar filtro de período",
      "Selecionar múltiplos tipos de evento",
      "Filtrar por localização",
      "Salvar visualização personalizada",
    ],
    expectedTime: 7,
    difficulty: "hard",
  },
]

export default function UserTestingPage() {
  const { toast } = useToast()
  const [selectedProfile, setSelectedProfile] = useState<string>("")
  const [selectedScenario, setSelectedScenario] = useState<string>("")
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: "result-1",
      scenarioId: "scenario-1",
      userId: "admin-1",
      completed: true,
      timeSpent: 4.5,
      usabilityScore: 9.2,
      comments: "Interface intuitiva, fácil de navegar",
      timestamp: "2025-01-10T10:30:00",
    },
    {
      id: "result-2",
      scenarioId: "scenario-2",
      userId: "analyst-1",
      completed: true,
      timeSpent: 7.2,
      usabilityScore: 8.5,
      comments: "Gráficos claros, mas poderia ter mais opções de exportação",
      timestamp: "2025-01-10T11:15:00",
    },
    {
      id: "result-3",
      scenarioId: "scenario-3",
      userId: "user-1",
      completed: false,
      timeSpent: 12.5,
      usabilityScore: 7.0,
      comments: "Tive dificuldade em encontrar a opção de editar convidados",
      timestamp: "2025-01-10T14:20:00",
    },
    {
      id: "result-4",
      scenarioId: "scenario-4",
      userId: "analyst-2",
      completed: true,
      timeSpent: 6.8,
      usabilityScore: 9.5,
      comments: "Filtros muito poderosos e bem organizados",
      timestamp: "2025-01-10T15:45:00",
    },
  ])

  const runSimulatedTest = () => {
    if (!selectedProfile || !selectedScenario) {
      toast({
        title: "Seleção incompleta",
        description: "Por favor, selecione um perfil e um cenário de teste.",
        variant: "destructive",
      })
      return
    }

    setIsTestRunning(true)
    setTestProgress(0)

    const interval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTestRunning(false)

          const scenario = testScenarios.find((s) => s.id === selectedScenario)
          const newResult: TestResult = {
            id: `result-${Date.now()}`,
            scenarioId: selectedScenario,
            userId: selectedProfile,
            completed: Math.random() > 0.2,
            timeSpent: scenario ? scenario.expectedTime * (0.8 + Math.random() * 0.4) : 5,
            usabilityScore: 7 + Math.random() * 3,
            comments: "Teste simulado concluído com sucesso",
            timestamp: new Date().toISOString(),
          }

          setTestResults((prev) => [...prev, newResult])

          toast({
            title: "Teste concluído",
            description: "Os resultados foram registrados com sucesso.",
          })

          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const calculateMetrics = () => {
    const completionRate = (testResults.filter((r) => r.completed).length / testResults.length) * 100
    const avgTime = testResults.reduce((acc, r) => acc + r.timeSpent, 0) / testResults.length
    const avgScore = testResults.reduce((acc, r) => acc + r.usabilityScore, 0) / testResults.length
    const successRate =
      (testResults.filter((r) => r.completed && r.usabilityScore >= 8).length / testResults.length) * 100

    return {
      completionRate,
      avgTime,
      avgScore,
      successRate,
    }
  }

  const metrics = calculateMetrics()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Testes com Usuários</h1>
          <p className="text-muted-foreground">
            Execute e monitore testes de usabilidade com diferentes perfis de usuários
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg">
              <Play className="h-4 w-4 mr-2" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurar Novo Teste</DialogTitle>
              <DialogDescription>Selecione o perfil de usuário e o cenário de teste</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile">Perfil de Usuário</Label>
                <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                  <SelectTrigger id="profile">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {userProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenario">Cenário de Teste</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger id="scenario">
                    <SelectValue placeholder="Selecione um cenário" />
                  </SelectTrigger>
                  <SelectContent>
                    {testScenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.title} - {scenario.difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedScenario && (
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">{testScenarios.find((s) => s.id === selectedScenario)?.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testScenarios.find((s) => s.id === selectedScenario)?.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {testScenarios.find((s) => s.id === selectedScenario)?.expectedTime} min
                    </span>
                    <Badge variant="outline">{testScenarios.find((s) => s.id === selectedScenario)?.difficulty}</Badge>
                  </div>
                </div>
              )}

              {isTestRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Executando teste...</span>
                    <span>{testProgress}%</span>
                  </div>
                  <Progress value={testProgress} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProfile("")}>
                Cancelar
              </Button>
              <Button onClick={runSimulatedTest} disabled={isTestRunning || !selectedProfile || !selectedScenario}>
                {isTestRunning ? "Executando..." : "Iniciar Teste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2%</span> em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgTime.toFixed(1)} min</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.8 min</span> mais rápido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgScore.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.3 pontos</span> de melhoria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Conclusão com nota alta</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Testes</CardTitle>
              <CardDescription>Resultados detalhados de todos os testes executados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result) => {
                  const scenario = testScenarios.find((s) => s.id === result.scenarioId)
                  const profile = userProfiles.find((p) => p.id === result.userId)

                  return (
                    <div key={result.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{scenario?.title}</h4>
                            {result.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {profile?.name}
                          </p>
                        </div>
                        <Badge variant={result.completed ? "default" : "destructive"}>
                          {result.completed ? "Concluído" : "Incompleto"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Tempo Gasto</div>
                          <div className="font-medium">{result.timeSpent.toFixed(1)} min</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Pontuação</div>
                          <div className="font-medium">{result.usabilityScore.toFixed(1)}/10</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Data</div>
                          <div className="font-medium">{new Date(result.timestamp).toLocaleDateString("pt-BR")}</div>
                        </div>
                      </div>

                      {result.comments && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground italic">"{result.comments}"</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userProfiles.map((profile) => {
              const profileResults = testResults.filter((r) => r.userId === profile.id)
              const avgScore =
                profileResults.length > 0
                  ? profileResults.reduce((acc, r) => acc + r.usabilityScore, 0) / profileResults.length
                  : 0

              return (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{profile.name}</CardTitle>
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>{profile.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Função</span>
                        <Badge variant="outline">{profile.role}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Experiência</span>
                        <Badge variant="outline">{profile.experience}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Testes Realizados</span>
                        <span className="font-medium">{profileResults.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pontuação Média</span>
                        <span className="font-medium">{avgScore > 0 ? avgScore.toFixed(1) : "-"}/10</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testScenarios.map((scenario) => {
              const scenarioResults = testResults.filter((r) => r.scenarioId === scenario.id)
              const completionRate =
                scenarioResults.length > 0
                  ? (scenarioResults.filter((r) => r.completed).length / scenarioResults.length) * 100
                  : 0

              return (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <Badge
                        variant={
                          scenario.difficulty === "easy"
                            ? "default"
                            : scenario.difficulty === "medium"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {scenario.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Tempo esperado: {scenario.expectedTime} min</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-medium">Tarefas:</div>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          {scenario.tasks.map((task, index) => (
                            <li key={index} className="list-disc">
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Testes Realizados</span>
                          <span className="font-medium">{scenarioResults.length}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Taxa de Conclusão</span>
                            <span className="font-medium">{completionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
