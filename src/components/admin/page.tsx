"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/* ================= TYPES ================= */

interface Registration {
  TeamID: string;
  TeamName: string;
  CollegeName: string;
  RegistrationDate: string;
  CaptainName: string;
  CaptainPhone: string;
  CaptainEmail: string;
  CaptainDOB: string;
  CaptainID: string;
  Category: string;
  SportCategory: string;
  DedupKey: string;
  Teammates: string; // JSON string
}

/* ================= COMPONENT ================= */

export default function AdminChavaraRegistrationsPage() {
  const [data, setData] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ========== FETCH DATA ========== */
  async function fetchData(query = "") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/chavara-registrations?q=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch data");
      }
      setData(json.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData(search);
  }, [search]);

  /* ========== HELPERS ========== */
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN");

  const parseTeammates = (json: string) => {
    try {
      return JSON.parse(json) as {
        name: string;
        dob: string;
        collegeId: string;
      }[];
    } catch {
      return [];
    }
  };

  /* ================= UI ================= */

  return (
    <Box p={4}>
      {/* Header */}
      <Typography variant="h4" fontWeight={700}>
        Chavara Cup – Admin Verification
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Search and verify team registrations
      </Typography>

      {/* Search */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Search"
          placeholder="Team Name or College Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 320 }}
        />
        <Button
          variant="contained"
          onClick={() => fetchData(search)}
          disabled={loading}
        >
          Search
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setSearch("");
            fetchData("");
          }}
        >
          Reset
        </Button>
      </Box>

      {error && (
        <Typography color="error" mb={2}>
          Error: {error}
        </Typography>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Team</b></TableCell>
              <TableCell><b>College</b></TableCell>
              <TableCell><b>Captain</b></TableCell>
              <TableCell><b>Phone</b></TableCell>
              <TableCell><b>Registered</b></TableCell>
              <TableCell><b>Action</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}

            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No registrations found
                </TableCell>
              </TableRow>
            )}

            {data.map((row) => (
              <TableRow key={row.TeamID} hover>
                <TableCell>{row.TeamName}</TableCell>
                <TableCell>{row.CollegeName}</TableCell>
                <TableCell>{row.CaptainName}</TableCell>
                <TableCell>{row.CaptainPhone}</TableCell>
                <TableCell>{formatDate(row.RegistrationDate)}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => setSelected(row)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* DETAILS MODAL */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Team Details
          <IconButton
            onClick={() => setSelected(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selected && (
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Detail label="Team Name" value={selected.TeamName} />
              <Detail label="College" value={selected.CollegeName} />
              <Detail label="Captain" value={selected.CaptainName} />
              <Detail label="Phone" value={selected.CaptainPhone} />
              <Detail label="Email" value={selected.CaptainEmail} />
              <Detail label="DOB" value={formatDate(selected.CaptainDOB)} />
              <Detail label="Captain ID" value={selected.CaptainID} />
              <Detail label="Dedup Key" value={selected.DedupKey} />

              <Box>
                <Typography fontWeight={600}>Category</Typography>
                <Chip label={selected.Category} size="small" />
              </Box>

              <Box>
                <Typography fontWeight={600}>Sport</Typography>
                <Chip label={selected.SportCategory} size="small" />
              </Box>

              <Box gridColumn="1 / -1">
                <Typography fontWeight={600} mb={1}>
                  Teammates
                </Typography>
                <ul>
                  {parseTeammates(selected.Teammates).map((m, i) => (
                    <li key={i}>
                      {m.name} — {m.collegeId} ({formatDate(m.dob)})
                    </li>
                  ))}
                </ul>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ================= HELPER COMPONENT ================= */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography fontWeight={600}>{label}</Typography>
      <Typography>{value}</Typography>
    </Box>
  );
}
