// SPDX-License-Identifier: GPL-3.0-or-later
// Intercepta connect()/sendto() y los anota (proceso, familia, destino) en $NETLOG_FILE.
// Se hereda en los procesos hijos (WebKitWebProcess, WebKitNetworkProcess, yt-dlp).
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/un.h>
#include <unistd.h>
#include <stdlib.h>
static int (*real_connect)(int, const struct sockaddr*, socklen_t);
static ssize_t (*real_sendto)(int, const void*, size_t, int, const struct sockaddr*, socklen_t);
static const char *comm(void) {
  static char name[64];
  FILE *f = fopen("/proc/self/comm", "r");
  if (!f) return "?";
  if (!fgets(name, sizeof name, f)) name[0] = 0;
  fclose(f);
  for (char *p = name; *p; p++) if (*p == '\n') *p = 0;
  return name;
}
static void logit(const char *what, const struct sockaddr *a) {
  if (!a) return;
  const char *f = getenv("NETLOG_FILE"); if (!f) return;
  FILE *fp = fopen(f, "a"); if (!fp) return;
  char buf[128] = "";
  if (a->sa_family == AF_INET) { inet_ntop(AF_INET, &((struct sockaddr_in*)a)->sin_addr, buf, sizeof buf); fprintf(fp, "%d %s %s INET %s:%d\n", getpid(), comm(), what, buf, ntohs(((struct sockaddr_in*)a)->sin_port)); }
  else if (a->sa_family == AF_INET6) { inet_ntop(AF_INET6, &((struct sockaddr_in6*)a)->sin6_addr, buf, sizeof buf); fprintf(fp, "%d %s %s INET6 %s:%d\n", getpid(), comm(), what, buf, ntohs(((struct sockaddr_in6*)a)->sin6_port)); }
  else if (a->sa_family == AF_UNIX) fprintf(fp, "%d %s %s UNIX %s\n", getpid(), comm(), what, ((struct sockaddr_un*)a)->sun_path[0] ? ((struct sockaddr_un*)a)->sun_path : "@abstract");
  fclose(fp);
}
int connect(int fd, const struct sockaddr *a, socklen_t l) { if (!real_connect) real_connect = dlsym(RTLD_NEXT, "connect"); logit("connect", a); return real_connect(fd, a, l); }
ssize_t sendto(int fd, const void *b, size_t n, int fl, const struct sockaddr *a, socklen_t l) { if (!real_sendto) real_sendto = dlsym(RTLD_NEXT, "sendto"); if (a) logit("sendto", a); return real_sendto(fd, b, n, fl, a, l); }
