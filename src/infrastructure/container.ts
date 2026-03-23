import { ChaosChessService } from "@/application/chaos-chess-service";
import { PassThroughModerator } from "@/infrastructure/moderation/pass-through-moderator";
import { LibsqlGameRepository } from "@/infrastructure/repositories/libsql-game-repository";

let singleton: ChaosChessService | null = null;

export function getChaosChessService(): ChaosChessService {
  if (singleton) {
    return singleton;
  }

  singleton = new ChaosChessService(new LibsqlGameRepository(), new PassThroughModerator());
  return singleton;
}

export function resetChaosChessService(): void {
  singleton = null;
}
