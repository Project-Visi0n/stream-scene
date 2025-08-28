var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { SocialAccountToken } from './SocialAccountToken.js';
let ScheduledPost = class ScheduledPost extends Model {
};
__decorate([
    PrimaryKey,
    AutoIncrement,
    Column(DataType.INTEGER),
    __metadata("design:type", Number)
], ScheduledPost.prototype, "id", void 0);
__decorate([
    AllowNull(false),
    ForeignKey(() => SocialAccountToken),
    Column(DataType.INTEGER),
    __metadata("design:type", Number)
], ScheduledPost.prototype, "socialAccountTokenId", void 0);
__decorate([
    BelongsTo(() => SocialAccountToken),
    __metadata("design:type", SocialAccountToken)
], ScheduledPost.prototype, "account", void 0);
__decorate([
    AllowNull(false),
    Column(DataType.TEXT),
    __metadata("design:type", String)
], ScheduledPost.prototype, "text", void 0);
__decorate([
    AllowNull(true),
    Column(DataType.JSON),
    __metadata("design:type", Object)
], ScheduledPost.prototype, "media", void 0);
__decorate([
    AllowNull(false),
    Column(DataType.DATE),
    __metadata("design:type", Date)
], ScheduledPost.prototype, "scheduledFor", void 0);
__decorate([
    AllowNull(false),
    Default('pending'),
    Column(DataType.STRING),
    __metadata("design:type", String)
], ScheduledPost.prototype, "status", void 0);
__decorate([
    AllowNull(true),
    Column(DataType.TEXT),
    __metadata("design:type", Object)
], ScheduledPost.prototype, "errorMessage", void 0);
__decorate([
    AllowNull(true),
    Column(DataType.STRING),
    __metadata("design:type", Object)
], ScheduledPost.prototype, "publishedPostId", void 0);
ScheduledPost = __decorate([
    Table({ tableName: 'ScheduledPosts', timestamps: true })
], ScheduledPost);
export { ScheduledPost };
