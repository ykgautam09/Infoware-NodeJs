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


