use local;

DROP TABLE IF EXISTS `user`;
create table if not exists `user`
(
    `name`        varchar(200)        not null,
    `email`       varchar(200) unique not null,
    `password`    varchar(200)        not null,
    `salt`        varchar(100)        not null,
    `contact`     varchar(10) unique DEFAULT null,
    `profile_pic` varchar(200)       default null,
    `role`        char(1)            default 0,
    `token`       varchar(200)       default null,
    `active`      char(1)            default 1
);


DROP TABLE IF EXISTS `product`;
create table if not exists `product`
(
    `id`       bigint primary key auto_increment,
    `name`     varchar(00)         not null,
    `category` varchar(200) unique not null,
    `size`     varchar(50)  default null,
    `color`    varchar(100) default null,
    `price`    decimal      default 0,
    `quantity` char(1)      default 5
);

DROP TABLE IF EXISTS `order`;
create table if not exists `order`
(
    `id`         bigint primary key auto_increment,
    `user_id`    bigint not null,
    `product_id` bigint not null,
    `quantity`   char(1)      default 5,
    `color`      varchar(100) default null,
    `amount`     decimal      default 0,
    `time`       datetime     default current_timestamp
);