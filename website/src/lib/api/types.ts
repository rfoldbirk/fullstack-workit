// Types mirroring the JSON shapes returned by @workit/server routes.
// Keep this file aligned to server/src/routes/*.ts.

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  picture: string | null;
};

export type MeUser = {
  id: number;
  name: string;
  email: string;
  date_of_birth: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: "male" | "female" | null;
  picture: string | null;
};

export type UserListItem = {
  name: string;
};

export type UsersResponse = UserListItem[];

export type SessionResponse = {
  user: PublicUser;
};

export type SignupOtpResponse = {
  status: "otp_sent";
};

export type LogoutResponse = {
  success: boolean;
};

export type MeResponse = MeUser;

export type CoachProfile = {
  user_id: number;
  price_dkk: number;
  max_clients: number | null;
  users: {
    id: number;
    name: string;
    email: string;
    picture: string | null;
  };
};

export type CoachProfileResponse = {
  myCoachProfile: CoachProfile | null;
  connectedCoach: CoachProfile | null;
};
export type WeightLogEntry = {
  timestamp: string;
  weight: number | null;
};

export type WeightLogHistory = WeightLogEntry[];

export type CoachSummary = {
  id: number;
  name: string;
  picture: string | null;
  priceDkk: number;
  currentClients: number;
  maxClients: number | null;
  isCurrentUserCoach: boolean;
};

export type MuscleGroupRef = {
  id: number;
  name: string;
};

export type Exercise = {
  id: number;
  name: string;
  description: string;
  equipment: string;
  ownerId: number | null;
  muscleGroups: MuscleGroupRef[];
};

export type CoachListItem = {
  id: number;
  name: string;
  email: string;
  picture: string | null;
  priceDkk: number;
  currentClients: number;
  maxClients: number | null;
  remainingSlots: number | null;
};

export type CoachesResponse = {
  summary: { totalCoaches: number };
  coaches: CoachListItem[];
};

export type ClientSummary = {
  id: number;
  name: string;
  email: string;
  picture: string | null;
  age: number | null;
  currentWeightKg: number | null;
  heightCm: number | null;
  completedWorkouts: number;
  weightLogCount: number;
  assignedProgramCount: number;
  latestActivityAt: string | null;
  latestProgram: { title: string; description: string | null } | null;
};

export type ClientsResponse = {
  summary: { clientCount: number; maxClients: number | null };
  clients: ClientSummary[];
};

export type ConnectCoachResponse = {
  coach: CoachProfile;
};

export type ProgramListItem = {
  id: number;
  name: string;
  description: string;
  accentGradientId: string | null;
  createdAt: string | null;
  exerciseCount: number;
};

export type LoggedSet = {
  id: number;
  userId: number;
  reps: number;
  kg: number;
  createdAt: string;
};

export type ProgramExerciseEntry = {
  exerciseOrderId: number;
  orderNr: number;
  exercise: {
    id: number;
    name: string;
    description: string;
    equipment: string;
    muscleGroups: MuscleGroupRef[];
  };
  recentLogs: LoggedSet[];
};

export type ProgramDetail = {
  id: number;
  name: string;
  description: string;
  accentGradientId: string | null;
  createdAt: string | null;
  exercises: ProgramExerciseEntry[];
};

export type ExerciseListItem = {
  id: number;
  name: string;
  description: string;
  equipment: string;
  ownerId: number | null;
  muscleGroups: MuscleGroupRef[];
};

export type ExercisesResponse = ExerciseListItem[];
export type ProgramsResponse = ProgramListItem[];
