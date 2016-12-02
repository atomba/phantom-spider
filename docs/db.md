
## Domain  Table

domain

category

### Domain Meta / Tags

Real Estate
Broker
Sale
Shopping
Job
ORG/Organization
GOV/Goverment
EDU/Education
Wiki
News
Porn
Social Network
Forum/BBS
Video


create table category (id integer PRIMARY KEY, category text, alias text, json text);

insert into category (category) values ('Real Estate');
insert into category (category) values ('Broker');
insert into category (category) values ('Sale');
insert into category (category) values ('Shop');
insert into category (category) values ('Job');
insert into category (category) values ('Organization');
insert into category (category) values ('Government');
insert into category (category) values ('Education');
insert into category (category) values ('Wiki');
insert into category (category) values ('News');
insert into category (category) values ('Porn');
insert into category (category) values ('Social Network');
insert into category (category) values ('Forum');
insert into category (category) values ('Video');


### Domain Table

1) rate 1 - 10 
2) scores = M {individual rate}
3) votes = number of people voted / rated 

create table domain (id integer PRIMARY KEY, catid integer, domain text, alias text, rate integer, votes integer, score integer, json text);
