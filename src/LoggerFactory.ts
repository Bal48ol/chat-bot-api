import { ISettingsParam, Logger, ILogObj } from "tslog";

const nameof = <T>(name: Extract<keyof T, string>): string => name;

class LoggerFactory {

  private params: ISettingsParam<ILogObj> = {};
  private loggers: Map<string, Logger<ILogObj>> = new Map();

  /**
   * Создать экземпляр логгера
   * @param name имя логгера (выводится в логе)
   * @param params настройка экземпляра
   * @returns настроенный экземпляр логгера
   */
  
  create(name: string, params?: ISettingsParam<ILogObj>): Logger<ILogObj> {
    if (this.loggers.has(name)) {
      return this.loggers.get(name);
    }
    else {
      const logger = new Logger({ name, ...{ ...this.params, ...(params || {}) } });
      this.loggers.set(name, logger);

      return logger;
    }
  }
}

/** Глобальный статический экземпляр фабрики */
export const loggerFactory: LoggerFactory = new LoggerFactory();