-- Run in Supabase SQL Editor after prisma db push
-- Enable RLS on all tables

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DefinitionGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Definition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DefinitionOwner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Condition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DefinitionVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChangeRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

-- Helper: user is workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "WorkspaceMember"
    WHERE "workspaceId" = ws_id AND "userId" = auth.uid()::text
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Definitions: members can read/write in their workspace
CREATE POLICY "definitions_select" ON "Definition"
  FOR SELECT USING (is_workspace_member("workspaceId"));

CREATE POLICY "definitions_insert" ON "Definition"
  FOR INSERT WITH CHECK (is_workspace_member("workspaceId"));

CREATE POLICY "definitions_update" ON "Definition"
  FOR UPDATE USING (is_workspace_member("workspaceId"));

CREATE POLICY "definitions_delete" ON "Definition"
  FOR DELETE USING (
    is_workspace_member("workspaceId")
    AND EXISTS (
      SELECT 1 FROM "WorkspaceMember" wm
      JOIN "User" u ON u.id = wm."userId"
      WHERE wm."workspaceId" = "Definition"."workspaceId"
        AND wm."userId" = auth.uid()::text
        AND (wm.role = 'OWNER' OR u.role = 'ADMIN')
    )
  );

-- Change requests: requester or approver
CREATE POLICY "change_requests_select" ON "ChangeRequest"
  FOR SELECT USING (
    "requestedById" = auth.uid()::text
    OR "reviewedById" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "Definition" d
      WHERE d.id = "ChangeRequest"."definitionId"
        AND d."approverId" = auth.uid()::text
    )
  );
