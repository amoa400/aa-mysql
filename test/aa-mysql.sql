/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 50619
 Source Host           : localhost
 Source Database       : aa-mysql

 Target Server Type    : MySQL
 Target Server Version : 50619
 File Encoding         : utf-8

 Date: 12/03/2014 12:07:51 PM
*/

SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `aa_order`
-- ----------------------------
DROP TABLE IF EXISTS `aa_order`;
CREATE TABLE `aa_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Records of `aa_order`
-- ----------------------------
BEGIN;
INSERT INTO `aa_order` VALUES ('1', '1', '1'), ('2', '2', '1'), ('3', '6', '1'), ('4', '3', '2'), ('5', '4', '2'), ('6', '1', '3'), ('7', '5', '3'), ('8', '6', '3'), ('9', '1', '4'), ('10', '2', '4'), ('11', '3', '4'), ('12', '4', '4'), ('13', '5', '4');
COMMIT;

-- ----------------------------
--  Table structure for `aa_product`
-- ----------------------------
DROP TABLE IF EXISTS `aa_product`;
CREATE TABLE `aa_product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shop_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `price` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Records of `aa_product`
-- ----------------------------
BEGIN;
INSERT INTO `aa_product` VALUES ('1', '1', 'Nike Air Max 2014 iD', '199'), ('2', '1', 'Nike Flyknit Air Max', '299'), ('3', '1', 'Nike Zoom Fit Agility', '99'), ('4', '2', 'Adidas Originals Men\'s Superstar ll Sneaker', '88'), ('5', '2', 'Adidas Performance Men\'s Duramo 6 M Running Shoe', '66'), ('6', '3', 'PUMA Suede Classic Sneaker', '55'), ('7', '3', 'PUMA Men\'s Roma Basic Sneaker', '77');
COMMIT;

-- ----------------------------
--  Table structure for `aa_shop`
-- ----------------------------
DROP TABLE IF EXISTS `aa_shop`;
CREATE TABLE `aa_shop` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Records of `aa_shop`
-- ----------------------------
BEGIN;
INSERT INTO `aa_shop` VALUES ('1', 'Nike'), ('2', 'Adidas'), ('3', 'PUMA');
COMMIT;

-- ----------------------------
--  Table structure for `aa_user`
-- ----------------------------
DROP TABLE IF EXISTS `aa_user`;
CREATE TABLE `aa_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Records of `aa_user`
-- ----------------------------
BEGIN;
INSERT INTO `aa_user` VALUES ('1', 'David'), ('2', 'Vito'), ('3', 'Lucy'), ('4', 'Peter');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
