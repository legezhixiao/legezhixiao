import { Sequelize } from 'sequelize';
import User from './User';
import Project from './Project';
import Chapter from './Chapter';
import Character from './Character';
import { initWorldBuildingModel, WorldBuilding } from './WorldBuilding';
import { initTimelineEventModel, TimelineEvent } from './TimelineEvent';
// import { initWritingSessionModel, WritingSession } from './WritingSession';
// import { initWritingGoalModel, WritingGoal } from './WritingGoal';
import { initWritingTemplateModel, WritingTemplate } from './WritingTemplate';

export interface Models {
  User: typeof User;
  Project: typeof Project;
  Chapter: typeof Chapter;
  Character: typeof Character;
  WorldBuilding: typeof WorldBuilding;
  TimelineEvent: typeof TimelineEvent;
  // WritingSession: typeof WritingSession;
  // WritingGoal: typeof WritingGoal;
  WritingTemplate: typeof WritingTemplate;
}

export function initializeModels(sequelize: Sequelize): Models {
  // 初始化所有模型 - 先注释掉关联关系，让服务器能启动
  const UserModel = User;
  const ProjectModel = Project;
  const ChapterModel = Chapter;
  const CharacterModel = Character;
  const WorldBuildingModel = initWorldBuildingModel();
  const TimelineEventModel = initTimelineEventModel();
  // const WritingSessionModel = initWritingSessionModel();
  // const WritingGoalModel = initWritingGoalModel();
  const WritingTemplateModel = initWritingTemplateModel();

  // 暂时注释掉关联关系定义，先让服务器启动
  /*
  // 定义关联关系
  
  // 用户与项目的关系 (一对多)
  UserModel.hasMany(ProjectModel, {
    foreignKey: 'userId',
    as: 'projects',
    onDelete: 'CASCADE',
  });
  ProjectModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'author',
  });
    as: 'author',
  });

  // 项目与章节的关系 (一对多)
  ProjectModel.hasMany(ChapterModel, {
    foreignKey: 'projectId',
    as: 'chapters',
    onDelete: 'CASCADE',
  });
  ChapterModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 项目与角色的关系 (一对多)
  ProjectModel.hasMany(CharacterModel, {
    foreignKey: 'projectId',
    as: 'characters',
    onDelete: 'CASCADE',
  });
  CharacterModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 项目与世界观设定的关系 (一对多)
  ProjectModel.hasMany(WorldBuildingModel, {
    foreignKey: 'projectId',
    as: 'worldBuilding',
    onDelete: 'CASCADE',
  });
  WorldBuildingModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 项目与时间线事件的关系 (一对多)
  ProjectModel.hasMany(TimelineEventModel, {
    foreignKey: 'projectId',
    as: 'timelineEvents',
    onDelete: 'CASCADE',
  });
  TimelineEventModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 用户与写作会话的关系 (一对多)
  UserModel.hasMany(WritingSessionModel, {
    foreignKey: 'userId',
    as: 'writingSessions',
    onDelete: 'CASCADE',
  });
  WritingSessionModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // 项目与写作会话的关系 (一对多)
  ProjectModel.hasMany(WritingSessionModel, {
    foreignKey: 'projectId',
    as: 'writingSessions',
    onDelete: 'CASCADE',
  });
  WritingSessionModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 章节与写作会话的关系 (一对多)
  ChapterModel.hasMany(WritingSessionModel, {
    foreignKey: 'chapterId',
    as: 'writingSessions',
    onDelete: 'SET NULL',
  });
  WritingSessionModel.belongsTo(ChapterModel, {
    foreignKey: 'chapterId',
    as: 'chapter',
  });

  // 用户与写作目标的关系 (一对多)
  UserModel.hasMany(WritingGoalModel, {
    foreignKey: 'userId',
    as: 'writingGoals',
    onDelete: 'CASCADE',
  });
  WritingGoalModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });

  // 项目与写作目标的关系 (一对多)
  ProjectModel.hasMany(WritingGoalModel, {
    foreignKey: 'projectId',
    as: 'writingGoals',
    onDelete: 'CASCADE',
  });
  WritingGoalModel.belongsTo(ProjectModel, {
    foreignKey: 'projectId',
    as: 'project',
  });

  // 用户与写作模板的关系 (一对多)
  UserModel.hasMany(WritingTemplateModel, {
    foreignKey: 'userId',
    as: 'writingTemplates',
    onDelete: 'CASCADE',
  });
  WritingTemplateModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'creator',
  });

  // 章节与角色的关系 (多对多，通过首次/最后出现)
  ChapterModel.hasMany(CharacterModel, {
    foreignKey: 'firstAppearance',
    as: 'introducedCharacters',
  });
  ChapterModel.hasMany(CharacterModel, {
    foreignKey: 'lastAppearance',
    as: 'finalCharacters',
  });
  
  CharacterModel.belongsTo(ChapterModel, {
    foreignKey: 'firstAppearance',
    as: 'firstChapter',
  });
  CharacterModel.belongsTo(ChapterModel, {
    foreignKey: 'lastAppearance',
    as: 'lastChapter',
  });
  */

  return {
    User: UserModel,
    Project: ProjectModel,
    Chapter: ChapterModel,
    Character: CharacterModel,
    WorldBuilding: WorldBuildingModel,
    TimelineEvent: TimelineEventModel,
    // WritingSession: WritingSessionModel,
    // WritingGoal: WritingGoalModel,
    WritingTemplate: WritingTemplateModel,
  } as any;
}
