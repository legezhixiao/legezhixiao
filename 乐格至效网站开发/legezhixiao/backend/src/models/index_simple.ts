
import { Sequelize } from 'sequelize';
import User from './User';
import UserArangoDB from './UserArangoDB';
import Project from './Project';
import Chapter, { ChapterVersion } from './Chapter';
import Character from './Character';
import { initWorldBuildingModel, WorldBuilding } from './WorldBuilding';
import { initTimelineEventModel, TimelineEvent } from './TimelineEvent';


export interface Models {
  User: typeof UserArangoDB;
  Project: typeof Project;
  Chapter: typeof Chapter;
  ChapterVersion: typeof ChapterVersion;
  Character: typeof Character;
  WorldBuilding: typeof WorldBuilding;
  TimelineEvent: typeof TimelineEvent;
}


export function initializeModels(sequelize: Sequelize): Models {
  // 初始化所有模型 - 使用ArangoDB版本
  const UserModel = UserArangoDB;
  const ProjectModel = Project;
  const ChapterModel = Chapter;
  const ChapterVersionModel = ChapterVersion;
  const CharacterModel = Character;
  const WorldBuildingModel = initWorldBuildingModel();
  const TimelineEventModel = initTimelineEventModel();

  // 暂时注释掉关联关系定义，先让服务器启动
  // TODO: 修复关联关系定义

  return {
    User: UserModel,
    Project: ProjectModel,
    Chapter: ChapterModel,
    ChapterVersion: ChapterVersionModel,
    Character: CharacterModel,
    WorldBuilding: WorldBuildingModel,
    TimelineEvent: TimelineEventModel,
  };
}
