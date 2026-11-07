#include <stdio.h>
#include <mpi.h>
#include <stdint.h>
#include "ptscotch.h"
/* 3-vertex edgeless distributed graph (rank r owns vertices r, r+np, ...) */
int main(int c,char**v){int r,np;MPI_Init(&c,&v);MPI_Comm_rank(MPI_COMM_WORLD,&r);MPI_Comm_size(MPI_COMM_WORLD,&np);
SCOTCH_Dgraph g;SCOTCH_Arch a;SCOTCH_Dmapping m;SCOTCH_Strat s;SCOTCH_Num vt[4]={0,0,0,0},ln=0,i,p[3];
for(i=r;i<3;i+=np)ln++;for(i=0;i<=ln;i++)vt[i]=0;
SCOTCH_dgraphInit(&g,MPI_COMM_WORLD);
if(SCOTCH_dgraphBuild(&g,0,ln,ln,vt,NULL,NULL,NULL,0,0,NULL,NULL,NULL)||SCOTCH_dgraphCheck(&g)){printf("build fail\n");return 1;}
SCOTCH_archInit(&a);SCOTCH_archCmplt(&a,2);SCOTCH_stratInit(&s);
SCOTCH_dgraphMapInit(&g,&m,&a,p);if(SCOTCH_dgraphMapCompute(&g,&m,&s)){printf("map fail\n");return 1;}
int rc=SCOTCH_dgraphMapView(&g,&m,r==0?stdout:NULL);
if(r==0)printf("rc=%d\n",rc);MPI_Finalize();return 0;}
