import re,sys
for f in sys.argv[1:]:
  cur=None;bad=0;n=0;grp={}
  for l in open(f):
    if l.startswith('=='): cur=l.strip(); grp[cur]=set(); continue
    m=re.search(r'ret=(\d+).*bal=(\S+) balcalc=(\S+)',l)
    if m:
      n+=1
      if m.group(2)!=m.group(3): bad+=1
      grp[cur].add(m.group(2))
  print(f,'rank lines',n,'bal!=balcalc',bad,'diverging probes',sum(len(v)>1 for v in grp.values()))
