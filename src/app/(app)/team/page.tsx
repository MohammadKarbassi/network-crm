import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { formatDate, roleLabel } from "@/lib/labels";
import { isAdmin } from "@/lib/permissions";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { UserFormDialog } from "./user-form-dialog";

export const metadata: Metadata = { title: "تیم فروش" };

export default async function TeamPage() {
  const me = await requireUser(["ADMIN", "SALES_MANAGER"]);
  const roles: Role[] = isAdmin(me.role) ? ["ADMIN", "SALES_MANAGER", "SALES_REP"] : ["SALES_REP"];
  const users = await db.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { customers: true, leads: true } } },
  });

  return (
    <>
      <PageHeader title="تیم فروش" description="کاربران سامانه و نقش هر کدام. هر کاربر با شماره موبایل خودش وارد می‌شود.">
        <UserFormDialog
          roles={roles}
          trigger={
            <Button>
              <Plus /> کاربر جدید
            </Button>
          }
        />
      </PageHeader>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>موبایل</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>مشتری / لید</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تاریخ عضویت</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const editable = isAdmin(me.role) || u.role === "SALES_REP";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell dir="ltr" className="text-end">{u.phone}</TableCell>
                  <TableCell>{roleLabel[u.role]}</TableCell>
                  <TableCell>
                    {u._count.customers.toLocaleString("fa-IR")} / {u._count.leads.toLocaleString("fa-IR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "secondary" : "outline"}>{u.isActive ? "فعال" : "غیرفعال"}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    {editable && (
                      <UserFormDialog
                        user={u}
                        roles={roles}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`ویرایش ${u.name}`}>
                            <Pencil />
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
